import {
  DEFAULT_CONFIG,
  getConfig,
  validateSchema,
  getHtmlForDocs
} from '../../src/shared';
import { DEFAULT_ERRORS, ValidMethod } from '../../src/constants';
import chalk from 'chalk';
import { createMockRouteRequest, resetCustomGlobals } from '../utils';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import {
  type DocsProvider,
  type NextRestFrameworkConfig
} from '../../src/types';
import { docsRouteHandler, routeHandler, routeOperation } from '../../src';
import fs from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readdirSync: () => [],
  readFileSync: () => Buffer.from(''), // No OpenAPI spec found.
  writeFileSync: () => {},
  existsSync: () => true
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  basename: () => 'route.js'
}));

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: () => {}
  })
}));

beforeEach(() => {
  resetCustomGlobals();
});

it('uses the default config by default', async () => {
  const { req, context } = createMockRouteRequest({
    method: ValidMethod.GET,
    path: '/api'
  });

  expect(global.nextRestFrameworkConfig).toEqual(undefined);
  await docsRouteHandler()(req, context);
  expect(global.nextRestFrameworkConfig).toEqual(DEFAULT_CONFIG);
});

it('sets the global config', async () => {
  const { req, context } = createMockRouteRequest({
    method: ValidMethod.GET,
    path: '/api'
  });

  const customConfig: NextRestFrameworkConfig = {
    openApiObject: {
      info: {
        title: 'Some Title',
        version: '1.2.3'
      }
    },
    openApiJsonPath: '/foo/bar'
  };

  await docsRouteHandler(customConfig)(req, context);
  expect(global.nextRestFrameworkConfig).toEqual(getConfig(customConfig));
});

it('logs init, reserved paths and config changed info', async () => {
  console.info = jest.fn();

  let { req, context } = createMockRouteRequest({
    method: ValidMethod.GET,
    path: '/api'
  });

  await docsRouteHandler()(req, context);

  expect(console.info).toHaveBeenNthCalledWith(
    1,
    chalk.green('Next REST Framework initialized! 🚀')
  );

  expect(console.info).toHaveBeenNthCalledWith(
    2,
    chalk.yellowBright(`Docs: http://localhost:3000/api
OpenAPI JSON: http://localhost:3000/openapi.json`)
  );

  expect(console.info).toHaveBeenNthCalledWith(
    3,
    chalk.yellowBright('No OpenAPI spec found, generating `openapi.json`...')
  );

  expect(console.info).toHaveBeenNthCalledWith(
    4,
    chalk.green('OpenAPI spec generated successfully!')
  );

  expect(console.info).toHaveBeenCalledTimes(4);

  ({ req, context } = createMockRouteRequest({
    method: ValidMethod.GET,
    path: '/api/foo/bar'
  }));

  jest.spyOn(fs, 'readFileSync').mockImplementation(() => Buffer.from('{}')); // OpenAPI spec found.
  await docsRouteHandler({ openApiJsonPath: '/api/bar/baz' })(req, context);

  expect(console.info).toHaveBeenNthCalledWith(
    5,
    chalk.green('Next REST Framework config changed, re-initializing!')
  );

  expect(console.info).toHaveBeenNthCalledWith(
    6,
    chalk.yellowBright(`Docs: http://localhost:3000/api/foo/bar
OpenAPI JSON: http://localhost:3000/api/bar/baz`)
  );

  expect(console.info).toHaveBeenNthCalledWith(
    7,
    chalk.yellowBright('OpenAPI spec changed, regenerating `openapi.json`...')
  );

  expect(console.info).toHaveBeenNthCalledWith(
    8,
    chalk.green('OpenAPI spec generated successfully!')
  );

  expect(console.info).toHaveBeenCalledTimes(8);
});

it('it does not log init info in prod', async () => {
  const { env } = process.env;
  process.env.NODE_ENV = 'production';
  console.info = jest.fn();

  const { req, context } = createMockRouteRequest({
    method: ValidMethod.GET,
    path: '/api'
  });

  await docsRouteHandler()(req, context);
  expect(console.info).not.toHaveBeenCalled();
  process.env.NODE_ENV = env;
});

it.each(['redoc', 'swagger-ui'] satisfies DocsProvider[])(
  'returns the docs HTML: %s',
  async (provider) => {
    const { req, context } = createMockRouteRequest({
      method: ValidMethod.GET,
      path: '/api'
    });

    const _config: NextRestFrameworkConfig = {
      docsConfig: {
        provider,
        title: 'foo',
        description: 'bar',
        faviconUrl: 'baz.ico',
        logoUrl: 'qux.jpeg'
      }
    };

    const res = await docsRouteHandler(_config)(req, context);
    const text = await res.text();

    const html = getHtmlForDocs({
      config: getConfig(_config),
      host: 'localhost:3000'
    });

    expect(text).toEqual(html);
    expect(text).toContain('foo');
    expect(text).toContain('bar');
    expect(text).toContain('baz.ico');
  }
);

it.each(Object.values(ValidMethod))(
  'works with HTTP method: %p',
  async (method) => {
    const { req, context } = createMockRouteRequest({
      method
    });

    const data = ['All good!'];

    const operation = routeOperation()
      .outputs([
        {
          status: 200,
          contentType: 'application/json',
          schema: z.array(z.string())
        }
      ])
      .handler(() => NextResponse.json(data));

    const res = await routeHandler({
      GET: operation,
      PUT: operation,
      POST: operation,
      DELETE: operation,
      OPTIONS: operation,
      HEAD: operation,
      PATCH: operation
    })(req, context);

    const json = await res?.json();
    expect(json).toEqual(data);
  }
);

it('returns error for missing handler', async () => {
  const { req, context } = createMockRouteRequest({
    method: ValidMethod.GET
  });

  const res = await routeHandler({
    GET: routeOperation().handler()
  })(req, context);

  const json = await res?.json();
  expect(res?.status).toEqual(500);

  expect(json).toEqual({
    message: DEFAULT_ERRORS.unexpectedError
  });
});

it('returns error for valid methods with no handlers', async () => {
  const { req, context } = createMockRouteRequest({
    method: ValidMethod.POST
  });

  const res = await routeHandler({
    GET: routeOperation().handler(() => {})
  })(req, context);

  const json = await res?.json();

  expect(res?.status).toEqual(405);
  expect(res?.headers.get('Allow')).toEqual('GET');

  expect(json).toEqual({
    message: DEFAULT_ERRORS.methodNotAllowed
  });
});

it('returns error for invalid request body', async () => {
  const body = {
    foo: 'bar'
  };

  const { req, context } = createMockRouteRequest({
    method: ValidMethod.POST,
    body,
    headers: {
      'content-type': 'application/json'
    }
  });

  const schema = z.object({
    foo: z.number()
  });

  const res = await routeHandler({
    POST: routeOperation()
      .input({
        contentType: 'application/json',
        body: schema
      })
      .handler(() => {})
  })(req, context);

  const json = await res?.json();
  expect(res?.status).toEqual(400);

  const { errors } = await validateSchema({ schema, obj: body });

  expect(json).toEqual({
    message: DEFAULT_ERRORS.invalidRequestBody,
    errors
  });
});

it('returns error for invalid query parameters', async () => {
  const query = {
    foo: 'bar'
  };

  const { req, context } = createMockRouteRequest({
    method: ValidMethod.POST,
    query,
    headers: {
      'content-type': 'application/json'
    }
  });

  const schema = z.object({
    bar: z.string()
  });

  const res = await routeHandler({
    POST: routeOperation()
      .input({
        contentType: 'application/json',
        query: schema
      })
      .handler(() => {})
  })(req, context);

  const json = await res?.json();
  expect(res?.status).toEqual(400);

  const { errors } = await validateSchema({ schema, obj: query });

  expect(json).toEqual({
    message: DEFAULT_ERRORS.invalidQueryParameters,
    errors
  });
});

it('returns error for invalid content-type', async () => {
  const { req, context } = createMockRouteRequest({
    method: ValidMethod.POST,
    body: {
      foo: 'bar'
    },
    headers: {
      'content-type': 'application/xml'
    }
  });

  const res = await routeHandler({
    POST: routeOperation()
      .input({
        contentType: 'application/json',
        body: z.string()
      })
      .handler(() => {})
  })(req, context);

  const json = await res?.json();
  expect(res?.status).toEqual(415);

  expect(json).toEqual({
    message: DEFAULT_ERRORS.invalidMediaType
  });
});

it.each([
  {
    definedContentType: 'application/json',
    requestContentType: 'application/json'
  },
  {
    definedContentType: 'application/json',
    requestContentType: 'application/json; charset=utf-8'
  },
  {
    definedContentType: 'application/form-data',
    requestContentType: 'application/form-data; name: "foo"'
  }
])(
  'works with different content types: %s',
  async ({ definedContentType, requestContentType }) => {
    const { req, context } = createMockRouteRequest({
      method: ValidMethod.POST,
      body: {
        foo: 'bar'
      },
      headers: {
        'content-type': requestContentType
      }
    });

    const res = await routeHandler({
      POST: routeOperation()
        .input({
          contentType: definedContentType,
          body: z.object({
            foo: z.string()
          })
        })
        .outputs([
          {
            status: 201,
            contentType: 'application/json',
            schema: z.object({
              foo: z.string()
            })
          }
        ])
        .handler(() => NextResponse.json({ foo: 'bar' }))
    })(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(200);
    expect(json).toEqual({ foo: 'bar' });
  }
);

it('returns a default error response', async () => {
  const { req, context } = createMockRouteRequest({
    method: ValidMethod.GET
  });

  console.error = jest.fn();

  const res = await routeHandler({
    GET: routeOperation().handler(() => {
      throw Error('Something went wrong');
    })
  })(req, context);

  const json = await res?.json();

  expect(json).toEqual({
    message: DEFAULT_ERRORS.unexpectedError
  });
});

it('executes middleware before validating input', async () => {
  const body = {
    foo: 'bar'
  };

  const { req, context } = createMockRouteRequest({
    method: ValidMethod.POST,
    body,
    headers: {
      'content-type': 'application/json'
    }
  });

  const schema = z.object({
    foo: z.number()
  });

  console.log = jest.fn();

  const res = await routeHandler({
    POST: routeOperation()
      .input({
        contentType: 'application/json',
        body: schema
      })
      .middleware(() => {
        console.log('foo');
      })
      .handler(() => {})
  })(req, context);

  expect(console.log).toHaveBeenCalledWith('foo');

  const json = await res?.json();
  expect(res?.status).toEqual(400);

  const { errors } = await validateSchema({ schema, obj: body });

  expect(json).toEqual({
    message: DEFAULT_ERRORS.invalidRequestBody,
    errors
  });
});

it('does not execute handler if middleware returns a response', async () => {
  const { req, context } = createMockRouteRequest({
    method: ValidMethod.GET
  });

  console.log = jest.fn();

  const res = await routeHandler({
    GET: routeOperation()
      .middleware(() => {
        return NextResponse.json({ foo: 'bar' }, { status: 200 });
      })
      .handler(() => {
        console.log('foo');
      })
  })(req, context);

  const json = await res?.json();
  expect(res?.status).toEqual(200);

  expect(json).toEqual({
    foo: 'bar'
  });

  expect(console.log).not.toHaveBeenCalled();
});
