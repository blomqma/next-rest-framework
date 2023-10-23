import { DEFAULT_CONFIG, getConfig, validateSchema } from '../../src/utils';
import { DEFAULT_ERRORS, ValidMethod } from '../../src/constants';
import chalk from 'chalk';
import { createMockApiRouteRequest, resetCustomGlobals } from '../utils';
import { z } from 'zod';
import {
  type DocsProvider,
  type NextRestFrameworkConfig
} from '../../src/types';
import { getHtmlForDocs } from '../../src/utils/docs';
import {
  apiRouteHandler,
  apiRouteOperation,
  docsApiRouteHandler
} from '../../src';
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
  basename: () => 'not-route.js'
}));

beforeEach(() => {
  resetCustomGlobals();
});

it('uses the default config by default', async () => {
  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.GET,
    path: '/api'
  });

  expect(global.nextRestFrameworkConfig).toEqual(undefined);
  await docsApiRouteHandler()(req, res);
  expect(global.nextRestFrameworkConfig).toEqual(DEFAULT_CONFIG);
});

it('sets the global config', async () => {
  const { req, res } = createMockApiRouteRequest({
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

  await docsApiRouteHandler(customConfig)(req, res);
  expect(global.nextRestFrameworkConfig).toEqual(getConfig(customConfig));
});

it('logs init, reserved paths and config changed info', async () => {
  console.info = jest.fn();

  let { req, res } = createMockApiRouteRequest({
    method: ValidMethod.GET,
    path: '/api'
  });

  await docsApiRouteHandler()(req, res);

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

  ({ req, res } = createMockApiRouteRequest({
    method: ValidMethod.GET,
    path: '/api/foo/bar'
  }));

  jest.spyOn(fs, 'readFileSync').mockImplementation(() => Buffer.from('{}')); // OpenAPI spec found.
  await docsApiRouteHandler({ openApiJsonPath: '/api/bar/baz' })(req, res);

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

it.each(['redoc', 'swagger-ui'] satisfies DocsProvider[])(
  'returns the docs HTML: %s',
  async (provider) => {
    const { req, res } = createMockApiRouteRequest({
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

    await docsApiRouteHandler(_config)(req, res);
    const text = res._getData();

    const html = getHtmlForDocs({
      config: getConfig(_config),
      baseUrl: 'http://localhost:3000'
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
    const { req, res } = createMockApiRouteRequest({
      method
    });

    const data = ['All good!'];

    const operation = apiRouteOperation()
      .output([
        {
          status: 200,
          contentType: 'application/json',
          schema: z.array(z.string())
        }
      ])
      .handler(() => {
        res.json(data);
      });

    await apiRouteHandler({
      GET: operation,
      PUT: operation,
      POST: operation,
      DELETE: operation,
      OPTIONS: operation,
      HEAD: operation,
      PATCH: operation
    })(req, res);

    expect(res._getJSONData()).toEqual(data);
  }
);

it('returns error for missing handler', async () => {
  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.GET
  });

  await apiRouteHandler({
    GET: apiRouteOperation().handler()
  })(req, res);

  const json = res._getJSONData();
  expect(res.statusCode).toEqual(500);

  expect(json).toEqual({
    message: DEFAULT_ERRORS.unexpectedError
  });
});

it('returns error for valid methods with no handlers', async () => {
  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.POST
  });

  await apiRouteHandler({
    GET: apiRouteOperation().handler(() => {})
  })(req, res);

  expect(res.statusCode).toEqual(405);
  expect(res.getHeader('Allow')).toEqual('GET');

  expect(res._getJSONData()).toEqual({
    message: DEFAULT_ERRORS.methodNotAllowed
  });
});

it('returns error for invalid request body', async () => {
  const body = {
    foo: 'bar'
  };

  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.POST,
    body,
    headers: {
      'content-type': 'application/json'
    }
  });

  const schema = z.object({
    foo: z.number()
  });

  await apiRouteHandler({
    POST: apiRouteOperation()
      .input({
        contentType: 'application/json',
        body: schema
      })
      .handler(() => {})
  })(req, res);

  expect(res.statusCode).toEqual(400);

  const { errors } = await validateSchema({ schema, obj: body });

  expect(res._getJSONData()).toEqual({
    message: 'Invalid request body.',
    errors
  });
});

it('returns error for invalid query parameters', async () => {
  const query = {
    foo: 'bar'
  };

  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.POST,
    query,
    headers: {
      'content-type': 'application/json'
    }
  });

  const schema = z.object({
    bar: z.string()
  });

  await apiRouteHandler({
    POST: apiRouteOperation()
      .input({
        contentType: 'application/json',
        query: schema
      })
      .handler(() => {})
  })(req, res);

  expect(res.statusCode).toEqual(400);

  const { errors } = await validateSchema({ schema, obj: query });

  expect(res._getJSONData()).toEqual({
    message: 'Invalid query parameters.',
    errors
  });
});

it('returns error for invalid content-type', async () => {
  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.POST,
    body: {
      foo: 'bar'
    },
    headers: {
      'content-type': 'application/xml'
    }
  });

  await apiRouteHandler({
    POST: apiRouteOperation()
      .input({
        contentType: 'application/json',
        body: z.string()
      })
      .handler(() => {})
  })(req, res);

  expect(res.statusCode).toEqual(415);

  expect(res._getJSONData()).toEqual({
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
    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      body: {
        foo: 'bar'
      },
      headers: {
        'content-type': requestContentType
      }
    });

    await apiRouteHandler({
      POST: apiRouteOperation()
        .input({
          contentType: definedContentType,
          body: z.object({
            foo: z.string()
          })
        })
        .output([
          {
            status: 201,
            contentType: 'application/json',
            schema: z.object({
              foo: z.string()
            })
          }
        ])
        .handler(() => {
          res.json({ foo: 'bar' });
        })
    })(req, res);

    expect(res.statusCode).toEqual(200);
    expect(res._getJSONData()).toEqual({ foo: 'bar' });
  }
);

it('returns a default error response', async () => {
  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.GET
  });

  console.error = jest.fn();

  await apiRouteHandler({
    GET: apiRouteOperation().handler(() => {
      throw Error('Something went wrong');
    })
  })(req, res);

  expect(res._getJSONData()).toEqual({
    message: DEFAULT_ERRORS.unexpectedError
  });
});

it('executes middleware before validating input', async () => {
  const body = {
    foo: 'bar'
  };

  const { req, res } = createMockApiRouteRequest({
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

  await apiRouteHandler({
    POST: apiRouteOperation()
      .input({
        contentType: 'application/json',
        body: schema
      })
      .middleware(() => {
        console.log('foo');
      })
      .handler(() => {})
  })(req, res);

  const { errors } = await validateSchema({ schema, obj: body });

  expect(res._getJSONData()).toEqual({
    message: 'Invalid request body.',
    errors
  });

  expect(res.statusCode).toEqual(400);
  expect(console.log).toHaveBeenCalledWith('foo');
});

it('does not execute handler if middleware returns a response', async () => {
  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.POST,
    body: {
      foo: 'bar'
    },
    headers: {
      'content-type': 'application/json'
    }
  });

  console.log = jest.fn();

  await apiRouteHandler({
    POST: apiRouteOperation()
      .middleware((_req, res) => {
        res.status(200).json({ foo: 'bar' });
      })
      .handler(() => {
        console.log('foo');
      })
  })(req, res);

  expect(res._getJSONData()).toEqual({
    foo: 'bar'
  });

  expect(res.statusCode).toEqual(200);
  expect(console.log).not.toHaveBeenCalled();
});
