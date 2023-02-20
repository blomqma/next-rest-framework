import { NextRestFramework } from '../src';
import * as openApiUtils from '../src/utils/open-api';
import { defaultResponse } from '../src/utils';
import {
  complexSchemaData,
  complexYupSchema,
  complexZodSchema,
  createNextRestFrameworkMocks,
  resetCustomGlobals
} from './utils';
import { NEXT_REST_FRAMEWORK_USER_AGENT } from '../src/constants';
import chalk from 'chalk';
import { z } from 'zod';
import * as yup from 'yup';

jest.mock('fs', () => ({
  readdirSync: () => [
    'foo.ts',
    'foo/bar.ts',
    'foo/bar/baz.ts',
    'foo/bar/[qux]/index.ts'
  ]
}));

beforeEach(() => {
  resetCustomGlobals();
});

const { defineEndpoints } = NextRestFramework();

const fooMethodHandlers = defineEndpoints({
  POST: {
    input: {
      contentType: 'application/json',
      body: complexZodSchema,
      query: z.object({
        foo: z.string()
      })
    },
    output: [
      {
        status: 201,
        schema: complexYupSchema,
        contentType: 'application/json'
      }
    ],
    handler: ({ req: { body }, res }) => {
      res.status(201).json(body);
    }
  }
});

const fooBarMethodHandlers = defineEndpoints({
  PUT: {
    input: {
      contentType: 'application/json',
      body: complexYupSchema,
      query: yup.object({
        foo: yup.string()
      })
    },
    output: [
      {
        status: 203,
        schema: complexZodSchema,
        contentType: 'application/json'
      }
    ],
    handler: ({ req: { body }, res }) => {
      res.status(203).json(body);
    }
  }
});

const fooBarBazMethodHandlers = defineEndpoints({
  GET: {
    output: [
      {
        status: 200,
        schema: complexZodSchema,
        contentType: 'application/json'
      }
    ],
    handler: ({ res }) => {
      res.status(200).send(complexSchemaData);
    }
  }
});

const fooBarBazQuxMethodHandlers = defineEndpoints({
  GET: {
    output: [
      {
        status: 200,
        schema: complexYupSchema,
        contentType: 'application/json'
      }
    ],
    handler: ({ res }) => {
      res.status(200).send(complexSchemaData);
    }
  }
});

jest.mock('../../../apps/src/dev/pages/api/foo', () => fooMethodHandlers, {
  virtual: true
});

jest.mock(
  '../../../apps/src/dev/pages/api/foo/bar',
  () => fooBarBazMethodHandlers,
  { virtual: true }
);

jest.mock(
  '../../../apps/src/dev/pages/api/foo/bar/baz',
  () => fooBarBazMethodHandlers,
  { virtual: true }
);

jest.mock(
  '../../../apps/src/dev/pages/api/foo/bar/[qux]/index',
  () => fooBarBazQuxMethodHandlers,
  { virtual: true }
);

// @ts-expect-error: TS expects the mock function to extend the typings of the global `fetch` function but we don't need those types here.
global.fetch = async (url: string) => {
  const path = url.replace('http://localhost:3000', '');

  const { req, res } = createNextRestFrameworkMocks({
    method: 'GET',
    path,
    query: {
      foo: 'bar'
    },
    headers: {
      'x-forwarded-proto': 'http',
      host: 'localhost:3000',
      'user-agent': NEXT_REST_FRAMEWORK_USER_AGENT
    }
  });

  const handlersForPaths = {
    '/api/foo': fooMethodHandlers,
    '/api/foo/bar': fooBarMethodHandlers,
    '/api/foo/bar/baz': fooBarBazMethodHandlers,
    '/api/foo/bar/{qux}': fooBarBazQuxMethodHandlers
  };

  const methodHandlers =
    handlersForPaths[path as keyof typeof handlersForPaths];

  await methodHandlers(req, res);
  const json = () => res._getJSONData();

  return {
    json,
    status: 200
  };
};

it('auto-generates the paths from the internal endpoint responses', async () => {
  const { req, res } = createNextRestFrameworkMocks({
    method: 'GET',
    path: '/api/openapi.json',
    headers: {
      'x-forwarded-proto': 'http',
      host: 'localhost:3000',
      'content-type': 'application/json'
    }
  });

  await NextRestFramework({
    apiRoutesPath: 'src/pages/api'
  }).defineCatchAllHandler()(req, res);
  const { paths } = res._getJSONData();

  const schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      age: {
        type: 'number'
      },
      hobbies: {
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            },
            properties: {
              type: 'object',
              properties: {
                foo: {
                  type: 'string'
                }
              }
            }
          }
        },
        type: 'array'
      },
      isCool: {
        type: 'boolean'
      }
    }
  };

  const requestBody = {
    content: {
      'application/json': {
        schema
      }
    }
  };

  const responseContent = {
    content: {
      'application/json': {
        schema
      }
    }
  };

  const parameters = [
    {
      name: 'foo',
      in: 'query'
    }
  ];

  expect(paths['/api/foo']).toEqual({
    post: {
      requestBody,
      responses: {
        '201': responseContent,
        default: defaultResponse
      },
      parameters
    }
  });

  expect(paths['/api/foo/bar']).toEqual({
    put: {
      requestBody,
      responses: {
        '203': responseContent,
        default: defaultResponse
      },
      parameters
    }
  });

  expect(paths['/api/foo/bar/baz']).toEqual({
    get: {
      requestBody: {
        content: {}
      },
      responses: {
        '200': responseContent,
        default: defaultResponse
      }
    }
  });

  expect(paths['/api/foo/bar/{qux}']).toEqual({
    get: {
      requestBody: {
        content: {}
      },
      responses: {
        '200': responseContent,
        default: defaultResponse
      }
    }
  });
});

it('handles error if the OpenAPI spec generation fails', async () => {
  console.error = jest.fn();

  jest.mock('../src/utils/open-api', () => {
    return {
      __esModule: true,
      ...jest.requireActual('../src/utils/open-api')
    };
  });

  const error = 'Something went wrong';

  jest
    .spyOn(openApiUtils, 'getPathsFromMethodHandlers')
    .mockImplementation(() => {
      throw Error(error);
    });

  const { req, res } = createNextRestFrameworkMocks({
    method: 'GET',
    path: '/api/openapi.json',
    headers: {
      'x-forwarded-proto': 'http',
      host: 'localhost:3000'
    }
  });

  await NextRestFramework().defineCatchAllHandler()(req, res);
  const { paths } = res._getJSONData();
  expect(paths).toEqual({});

  expect(console.error).toHaveBeenNthCalledWith(
    1,
    chalk.red(`Next REST Framework encountered an error:
${'Error: OpenAPI spec generation failed for route: /api/foo'}
${`Error: ${error}`}`)
  );

  expect(console.error).toHaveBeenNthCalledWith(
    2,
    chalk.red(`Next REST Framework encountered an error:
${'Error: OpenAPI spec generation failed for route: /api/foo/bar'}
${`Error: ${error}`}`)
  );

  expect(console.error).toHaveBeenNthCalledWith(
    3,
    chalk.red(`Next REST Framework encountered an error:
${'Error: OpenAPI spec generation failed for route: /api/foo/bar/baz'}
${`Error: ${error}`}`)
  );

  expect(console.error).toHaveBeenNthCalledWith(
    4,
    chalk.red(`Next REST Framework encountered an error:
${'Error: OpenAPI spec generation failed for route: /api/foo/bar/{qux}'}
${`Error: ${error}`}`)
  );
});
