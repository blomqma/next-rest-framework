import { type ZodSchema } from 'zod';
import { NextRequest } from 'next/server';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_ERRORS,
  DEFAULT_TITLE,
  OPEN_API_VERSION,
  VERSION,
  ValidMethod
} from '../src/constants';
import {
  createMocks,
  type RequestOptions,
  type ResponseOptions
} from 'node-mocks-http';
import chalk from 'chalk';
import zodToJsonSchema from 'zod-to-json-schema';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { type BaseQuery, type Modify } from '../src/types';
import { type OpenAPIV3_1 } from 'openapi-types';

export const resetCustomGlobals = () => {
  global.nextRestFrameworkConfig = undefined;
};

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
  params?: BaseQuery;
  headers?: Record<string, string>;
}): {
  req: NextRequest;
  context: { params: typeof params };
} => ({
  req: new NextRequest(
    `http://localhost:3000${path}${
      query ? `?${new URLSearchParams(query).toString()}` : ''
    }`,
    {
      method,
      body: JSON.stringify(body),
      headers: {
        host: 'localhost:3000',
        'x-forwarded-proto': 'http',
        ...headers
      }
    }
  ),
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
} => {
  const { req } = createMockRouteRequest({
    path,
    body,
    method,
    headers: {
      'X-RPC-Operation': operation,
      'Content-Type': 'application/json',
      ...headers
    }
  });

  return { req };
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
    path,
    body,
    method,
    headers: {
      'X-RPC-Operation': operation,
      'Content-Type': 'application/json',
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
  const schema = zodToJsonSchema(zodSchema, { target: 'openApi3' });

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

  let paths: OpenAPIV3_1.PathsObject = {};
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

  if (!deniedPaths.includes('/api/foo') && allowedPaths.includes('/api/foo')) {
    paths = {
      ...paths,
      '/api/foo': {
        post: {
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PostFooRequestBody'
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
                    $ref: '#/components/schemas/PostFooResponseBody'
                  }
                }
              }
            },
            ...defaultResponses
          },
          parameters
        }
      }
    };

    schemas = {
      ...schemas,
      ...defaultSchemas,
      PostFooRequestBody: schema,
      PostFooResponseBody: schema
    };
  }

  if (
    !deniedPaths.includes('/api/foo/bar') &&
    allowedPaths.includes('/api/foo/bar')
  ) {
    paths = {
      ...paths,
      '/api/foo/bar': {
        put: {
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PutBarRequestBody'
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
                    $ref: '#/components/schemas/PutBarResponseBody'
                  }
                }
              }
            },
            ...defaultResponses
          },
          parameters
        }
      }
    };

    schemas = {
      ...schemas,
      ...defaultSchemas,
      PutBarRequestBody: schema,
      PutBarResponseBody: schema
    };
  }

  if (
    !deniedPaths.includes('/api/foo/bar/baz') &&
    allowedPaths.includes('/api/foo/bar/baz')
  ) {
    paths = {
      ...paths,
      '/api/foo/bar/baz': {
        get: {
          responses: {
            '200': {
              description: 'Response for status 200',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GetBazResponseBody'
                  }
                }
              }
            },
            ...defaultResponses
          }
        }
      }
    };

    schemas = {
      ...schemas,
      ...defaultSchemas,
      GetBazResponseBody: schema
    };
  }

  if (
    !deniedPaths.includes('/api/foo/bar/{qux}') &&
    allowedPaths.includes('/api/foo/bar/{qux}')
  ) {
    paths = {
      ...paths,
      '/api/foo/bar/{qux}': {
        get: {
          parameters: [
            {
              in: 'path',
              name: 'qux',
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
                    $ref: '#/components/schemas/GetBarResponseBody'
                  }
                }
              }
            },
            ...defaultResponses
          }
        }
      }
    };

    schemas = {
      ...schemas,
      ...defaultSchemas,
      GetBarResponseBody: schema
    };
  }

  if (
    !deniedPaths.includes('/api/foo/bar/{qux}/quux/{corge}') &&
    allowedPaths.includes('/api/foo/bar/{qux}/quux/{corge}')
  ) {
    paths = {
      ...paths,
      '/api/foo/bar/{qux}/quux/{corge}': {
        get: {
          parameters: [
            {
              in: 'path',
              name: 'qux',
              required: true,
              schema: { type: 'string' }
            },
            {
              in: 'path',
              name: 'corge',
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
                    $ref: '#/components/schemas/GetQuuxResponseBody'
                  }
                }
              }
            },
            ...defaultResponses
          }
        }
      }
    };

    schemas = {
      ...schemas,
      ...defaultSchemas,
      GetQuuxResponseBody: schema
    };
  }

  const spec: OpenAPIV3_1.Document = {
    openapi: OPEN_API_VERSION,
    info: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      version: `v${VERSION}`
    },
    paths,
    components: {
      schemas
    }
  };

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
${'Error: OpenAPI spec generation failed for route: /api/foo/bar/{qux}'}
${`Error: ${error}`}`)
  );

  expect(console.error).toHaveBeenNthCalledWith(
    5,
    chalk.red(`Next REST Framework encountered an error:
${'Error: OpenAPI spec generation failed for route: /api/foo/bar/{qux}/quux/{corge}'}
${`Error: ${error}`}`)
  );
};
