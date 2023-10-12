import { defineApiRoute, defineDocsApiRoute } from '../../src';
import { DEFAULT_CONFIG, getConfig, validateSchema } from '../../src/utils';
import { DEFAULT_ERRORS, ValidMethod } from '../../src/constants';
import chalk from 'chalk';
import { createMockApiRouteRequest, resetCustomGlobals } from '../utils';
import { z } from 'zod';
import { type NextRestFrameworkConfig } from '../../src/types';
import { getHtmlForDocs } from '../../src/utils/docs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readdirSync: () => [],
  readFileSync: () => '',
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
  await defineDocsApiRoute()(req, res);
  expect(global.nextRestFrameworkConfig).toEqual(DEFAULT_CONFIG);
});

it('sets the global config', async () => {
  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.GET,
    path: '/api'
  });

  const customConfig: NextRestFrameworkConfig = {
    openApiSpecOverrides: {
      info: {
        title: 'Some Title',
        version: '1.2.3'
      },
      paths: {}
    },
    openApiJsonPath: '/foo/bar'
  };

  await defineDocsApiRoute(customConfig)(req, res);
  expect(global.nextRestFrameworkConfig).toEqual(getConfig(customConfig));
});

it('logs init, reserved paths and config changed info', async () => {
  console.info = jest.fn();

  let { req, res } = createMockApiRouteRequest({
    method: ValidMethod.GET,
    path: '/api'
  });

  await defineDocsApiRoute()(req, res);

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
    chalk.yellowBright('No API spec found, generating openapi.json')
  );

  expect(console.info).toHaveBeenNthCalledWith(
    4,
    chalk.green('API spec generated successfully!')
  );

  expect(console.info).toHaveBeenCalledTimes(4);

  ({ req, res } = createMockApiRouteRequest({
    method: ValidMethod.GET,
    path: '/api/foo/bar'
  }));

  await defineDocsApiRoute({ openApiJsonPath: '/api/bar/baz' })(req, res);

  expect(console.info).toHaveBeenNthCalledWith(
    5,
    chalk.green('Next REST Framework config changed, re-initializing!')
  );

  expect(console.info).toHaveBeenNthCalledWith(
    6,
    chalk.yellowBright(`Docs: http://localhost:3000/api/foo/bar
OpenAPI JSON: http://localhost:3000/api/bar/baz`)
  );

  expect(console.info).toHaveBeenCalledTimes(6);
});

it('returns the docs HTML', async () => {
  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.GET,
    path: '/api'
  });

  const _config: NextRestFrameworkConfig = {
    docsConfig: {
      title: 'foo',
      description: 'bar',
      faviconUrl: 'baz.ico',
      logoUrl: 'qux.jpeg'
    }
  };

  await defineDocsApiRoute(_config)(req, res);
  const text = res._getData();

  const html = getHtmlForDocs({
    config: getConfig(_config),
    baseUrl: 'http://localhost:3000'
  });

  expect(text).toEqual(html);
  expect(text).toContain('foo');
  expect(text).toContain('bar');
  expect(text).toContain('baz.ico');
});

it.each(Object.values(ValidMethod))(
  'works with HTTP method: %p',
  async (method) => {
    const { req, res } = createMockApiRouteRequest({
      method
    });

    const output = [
      {
        status: 200,
        contentType: 'application/json',
        schema: z.array(z.string())
      }
    ];

    const data = ['All good!'];
    const handler = () => {
      res.json(data);
    };

    await defineApiRoute({
      GET: {
        output,
        handler
      },
      PUT: {
        output,
        handler
      },
      POST: {
        output,
        handler
      },
      DELETE: {
        output,
        handler
      },
      OPTIONS: {
        output,
        handler
      },
      HEAD: {
        output,
        handler
      },
      PATCH: {
        output,
        handler
      }
    })(req, res);

    expect(res._getJSONData()).toEqual(data);
  }
);

it('returns error for valid methods with no handlers', async () => {
  const { req, res } = createMockApiRouteRequest({
    method: ValidMethod.POST
  });

  await defineApiRoute({
    GET: {
      output: [],
      handler: () => {}
    }
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

  await defineApiRoute({
    POST: {
      input: {
        contentType: 'application/json',
        body: schema
      },
      output: [],
      handler: () => {}
    }
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
    foo: z.number()
  });

  await defineApiRoute({
    POST: {
      input: {
        contentType: 'application/json',
        query: schema
      },
      output: [],
      handler: () => {}
    }
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

  await defineApiRoute({
    POST: {
      input: {
        contentType: 'application/json',
        body: z.string()
      },
      output: [],
      handler: () => {}
    }
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

    await defineApiRoute({
      POST: {
        input: {
          contentType: definedContentType,
          body: z.object({
            foo: z.string()
          })
        },
        output: [
          {
            status: 201,
            contentType: 'application/json',
            schema: z.object({
              foo: z.string()
            })
          }
        ],
        handler: () => {
          res.json({ foo: 'bar' });
        }
      }
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

  await defineApiRoute({
    GET: {
      output: [],
      handler: () => {
        throw Error('Something went wrong');
      }
    }
  })(req, res);

  expect(res._getJSONData()).toEqual({
    message: DEFAULT_ERRORS.unexpectedError
  });
});
