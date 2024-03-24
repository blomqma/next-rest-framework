import { type ZodSchema } from 'zod';
import { NextRequest } from 'next/server';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_ERRORS,
  DEFAULT_TITLE,
  VERSION,
  ValidMethod
} from '../src/constants';
import {
  createMocks,
  type RequestOptions,
  type ResponseOptions
} from 'node-mocks-http';
import chalk from 'chalk';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { type BaseParams, type Modify } from '../src/types';
import { type OpenAPIV3_1 } from 'openapi-types';
import { getJsonSchema } from '../src/shared';
import { OPEN_API_VERSION } from '../src/cli/constants';
import qs from 'qs';

export const createMockRouteRequest = <Body, Query>({
  path = '/',
  body,
  method,
  query,
  params = {},
  headers
}: {
  method: ValidMethod;
  path?: string;
  body?: Body;
  query?: Query;
  params?: BaseParams;
  headers?: Record<string, string>;
}): {
  req: NextRequest;
  context: { params: typeof params };
} => ({
  req: new NextRequest(`http://localhost:3000${path}?${qs.stringify(query)}`, {
    method,
    body:
      body instanceof URLSearchParams || body instanceof FormData
        ? body
        : JSON.stringify(body),
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...headers
    }
  }),
  context: { params }
});

export const createMockRpcRouteRequest = <Body>({
  path = '/',
  body,
  method = ValidMethod.POST,
  operation = 'test',
  headers
}: {
  method?: ValidMethod;
  path?: string;
  body?: Body;
  operation?: string;
  headers?: Record<string, string>;
} = {}): {
  req: NextRequest;
  context: { params: { operationId: typeof operation } };
} => {
  const { req } = createMockRouteRequest({
    path,
    body,
    method,
    headers: {
      ...headers
    }
  });

  return { req, context: { params: { operationId: operation } } };
};

export const createMockApiRouteRequest = <
  Body,
  Query = Partial<Record<string, string | string[]>>
>(
  _reqOptions?: Modify<RequestOptions, { body?: Body; query?: Query }>,
  resOptions?: ResponseOptions
) => {
  const reqOptions = {
    ..._reqOptions,
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ..._reqOptions?.headers
    }
  };

  // @ts-expect-error: The `NextApiRequest` does not satisfy the types for `Request`.
  return createMocks<NextApiRequest, NextApiResponse>(reqOptions, resOptions);
};

export const createMockRpcApiRouteRequest = <Body>({
  path = '/',
  body,
  method = ValidMethod.POST,
  operation = 'test',
  headers
}: {
  method?: ValidMethod;
  path?: string;
  body?: Body;
  operation?: string;
  headers?: Record<string, string>;
} = {}) =>
  createMockApiRouteRequest({
    path: `${path}?operationId=${operation}`,
    body,
    method,
    headers: {
      ...headers
    }
  });

export const getExpectedSpec = ({
  zodSchema,
  allowedPaths,
  deniedPaths
}: {
  zodSchema: ZodSchema;
  allowedPaths: string[];
  deniedPaths: string[];
}) => {
  const schema = getJsonSchema({
    schema: zodSchema,
    operationId: 'test',
    type: 'input-body'
  });

  const parameters: OpenAPIV3_1.ParameterObject[] = [
    {
      name: 'foo',
      in: 'query',
      required: true,
      schema: {
        type: 'string'
      }
    }
  ];

  const paths: OpenAPIV3_1.PathsObject = {};

  const defaultSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
    UnexpectedError: {
      type: 'object',
      additionalProperties: false,
      properties: {
        message: {
          type: 'string'
        }
      }
    }
  };

  let schemas: Record<string, OpenAPIV3_1.SchemaObject> = {};

  const defaultResponses: OpenAPIV3_1.ResponsesObject = {
    '500': {
      description: DEFAULT_ERRORS.unexpectedError,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/UnexpectedError'
          }
        }
      }
    }
  };

  if (!deniedPaths.includes('/api/foo') && allowedPaths.includes('/api/foo')) {
    paths['/api/foo'] = {
      post: {
        operationId: 'foo',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/FooRequestBody'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Response for status 201',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Foo201ResponseBody'
                }
              }
            }
          },
          ...defaultResponses
        },
        parameters
      }
    };

    schemas = {
      ...defaultSchemas,
      FooRequestBody: schema,
      Foo201ResponseBody: schema
    };
  }

  if (
    !deniedPaths.includes('/api/foo/bar') &&
    allowedPaths.includes('/api/foo/bar')
  ) {
    paths['/api/foo/bar'] = {
      put: {
        operationId: 'fooBar',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/FooBarRequestBody'
              }
            }
          }
        },
        responses: {
          '203': {
            description: 'Response for status 203',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FooBar203ResponseBody'
                }
              }
            }
          },
          ...defaultResponses
        },
        parameters
      }
    };

    schemas = {
      ...schemas,
      ...defaultSchemas,
      FooBarRequestBody: schema,
      FooBar203ResponseBody: schema
    };
  }

  if (
    !deniedPaths.includes('/api/foo/bar/baz') &&
    allowedPaths.includes('/api/foo/bar/baz')
  ) {
    paths['/api/foo/bar/baz'] = {
      get: {
        operationId: 'fooBarBaz',
        responses: {
          '200': {
            description: 'Response for status 200',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FooBarBaz200ResponseBody'
                }
              }
            }
          },
          ...defaultResponses
        }
      }
    };

    schemas = {
      ...schemas,
      ...defaultSchemas,
      FooBarBaz200ResponseBody: schema
    };
  }

  if (
    !deniedPaths.includes('/api/foo/bar/{baz}') &&
    allowedPaths.includes('/api/foo/bar/{baz}')
  ) {
    paths['/api/foo/bar/{baz}'] = {
      get: {
        operationId: 'fooBarBazQux',
        parameters: [
          {
            in: 'path',
            name: 'baz',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Response for status 200',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FooBarBazQux200ResponseBody'
                }
              }
            }
          },
          ...defaultResponses
        }
      }
    };

    schemas = {
      ...schemas,
      ...defaultSchemas,
      FooBarBazQux200ResponseBody: schema
    };
  }

  if (
    !deniedPaths.includes('/api/foo/bar/{baz}/qux/{fred}') &&
    allowedPaths.includes('/api/foo/bar/{baz}/qux/{fred}')
  ) {
    paths['/api/foo/bar/{baz}/qux/{fred}'] = {
      get: {
        operationId: 'fooBarBazQuxFred',
        parameters: [
          {
            in: 'path',
            name: 'baz',
            required: true,
            schema: { type: 'string' }
          },
          {
            in: 'path',
            name: 'fred',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Response for status 200',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FooBarBazQuxFred200ResponseBody'
                }
              }
            }
          },
          ...defaultResponses
        }
      }
    };

    schemas = {
      ...schemas,
      ...defaultSchemas,
      FooBarBazQuxFred200ResponseBody: schema
    };
  }

  const spec: OpenAPIV3_1.Document = {
    openapi: OPEN_API_VERSION,
    info: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      version: `v${VERSION}`
    },
    paths
  };

  if (Object.keys(schemas).length) {
    spec.components = {
      schemas
    };
  }

  return spec;
};

export const expectOpenAPIGenerationErrors = (error: unknown) => {
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
${'Error: OpenAPI spec generation failed for route: /api/foo/bar/{baz}'}
${`Error: ${error}`}`)
  );

  expect(console.error).toHaveBeenNthCalledWith(
    5,
    chalk.red(`Next REST Framework encountered an error:
${'Error: OpenAPI spec generation failed for route: /api/foo/bar/{baz}/qux/{fred}'}
${`Error: ${error}`}`)
  );
};
