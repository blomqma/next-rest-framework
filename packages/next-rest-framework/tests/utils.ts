import { type ZodSchema } from 'zod';
import { NextRequest } from 'next/server';
import { type ValidMethod } from '../src/constants';
import {
  type TypedNextApiRequest,
  type TypedNextRequest
} from '../src/types/request';
import {
  createMocks,
  type RequestOptions,
  type ResponseOptions
} from 'node-mocks-http';
import { type Modify } from '../src/types';
import { type NextApiResponse } from 'next/types';
import { defaultResponse } from '../src/utils';
import chalk from 'chalk';
import zodToJsonSchema from 'zod-to-json-schema';

export const resetCustomGlobals = () => {
  global.nextRestFrameworkConfig = undefined;
  global.openApiSpec = undefined;
  global.apiSpecGeneratedLogged = false;
  global.reservedPathsLogged = false;
  global.reservedOpenApiJsonPathWarningLogged = false;
  global.reservedOpenApiYamlPathWarningLogged = false;
  global.reservedSwaggerUiPathWarningLogged = false;
  global.appDirNotFoundLogged = false;
  global.apiRoutesPathsNotFoundLogged = false;
  global.ignoredPathsLogged = false;
};

export const createNextRestFrameworkMocks = <
  Body,
  Params extends Record<string, unknown>
>({
  path = '/',
  body,
  method,
  query,
  headers
}: {
  method: ValidMethod;
  path?: string;
  body?: Body;
  query?: Params;
  headers?: Record<string, string>;
}): {
  req: TypedNextRequest<Body>;
  context: { params: Params };
} => ({
  req: new NextRequest('http://localhost:3000' + path, {
    method,
    body: JSON.stringify(body),
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...headers
    }
  }) as TypedNextRequest<Body>,
  context: { params: (query ?? {}) as Params }
});

export const createApiRouteMocks = <
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

  // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return createMocks<TypedNextApiRequest<Body, Query>, NextApiResponse>(
    reqOptions as RequestOptions,
    resOptions
  );
};

export const expectPathsResponse = ({
  zodSchema,
  paths,
  allowedPaths,
  deniedPaths
}: {
  zodSchema: ZodSchema;
  paths: Record<string, unknown>;
  allowedPaths?: string[];
  deniedPaths?: string[];
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

  if (
    deniedPaths?.includes('/api/foo') ??
    (allowedPaths && !allowedPaths.includes('/api/foo'))
  ) {
    expect(paths).not.toContain('/api/foo');
  } else {
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
  }

  if (
    deniedPaths?.includes('/api/foo/bar') ??
    (allowedPaths && !allowedPaths.includes('/api/foo/bar'))
  ) {
    expect(paths).not.toContain('/api/foo/bar');
  } else {
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
  }

  if (
    deniedPaths?.includes('/api/foo/bar/baz') ??
    (allowedPaths && !allowedPaths.includes('/api/foo/bar/baz'))
  ) {
    expect(paths).not.toContain('/api/foo/bar/baz');
  } else {
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
  }

  if (
    deniedPaths?.includes('/api/foo/bar/{qux}') ??
    (allowedPaths && !allowedPaths.includes('/api/foo/bar/{qux}'))
  ) {
    expect(paths).not.toContain('/api/foo/bar/{qux}');
  } else {
    expect(paths['/api/foo/bar/{qux}']).toEqual({
      get: {
        parameters: [
          {
            in: 'path',
            name: 'qux',
            required: true
          }
        ],
        requestBody: {
          content: {}
        },
        responses: {
          '200': responseContent,
          default: defaultResponse
        }
      }
    });
  }
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
