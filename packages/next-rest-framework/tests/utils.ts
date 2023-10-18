import { type ZodSchema } from 'zod';
import { NextRequest } from 'next/server';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OPEN_API_VERSION,
  VERSION,
  type ValidMethod
} from '../src/constants';
import {
  createMocks,
  type RequestOptions,
  type ResponseOptions
} from 'node-mocks-http';
import { defaultResponse } from '../src/utils';
import chalk from 'chalk';
import zodToJsonSchema from 'zod-to-json-schema';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { type BaseQuery, type Modify } from '../src/types';

export const resetCustomGlobals = () => {
  global.nextRestFrameworkConfig = undefined;
  global.openApiSpec = undefined;
  global.apiSpecGeneratedLogged = false;
  global.ignoredPathsLogged = false;
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

  let paths = {};

  if (!deniedPaths.includes('/api/foo') && allowedPaths.includes('/api/foo')) {
    paths = {
      ...paths,
      '/api/foo': {
        post: {
          requestBody,
          responses: {
            '201': responseContent,
            default: defaultResponse
          },
          parameters
        }
      }
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
          requestBody,
          responses: {
            '203': responseContent,
            default: defaultResponse
          },
          parameters
        }
      }
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
            '200': responseContent,
            default: defaultResponse
          }
        }
      }
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
              required: true
            }
          ],
          responses: {
            '200': responseContent,
            default: defaultResponse
          }
        }
      }
    };
  }

  const spec = {
    openapi: OPEN_API_VERSION,
    info: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      version: `v${VERSION}`
    },
    paths
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
};
