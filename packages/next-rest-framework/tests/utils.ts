import { z } from 'zod';
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

export const resetCustomGlobals = () => {
  global.nextRestFrameworkConfig = undefined;
  global.openApiSpec = undefined;
  global.apiSpecGeneratedLogged = false;
  global.reservedPathsLogged = false;
  global.reservedOpenApiJsonPathWarningLogged = false;
  global.reservedOpenApiYamlPathWarningLogged = false;
  global.reservedSwaggerUiPathWarningLogged = false;
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

enum NativeEnum {
  Foo = 'foo',
  Bar = 'bar',
  Baz = 'baz'
}

const primitives = z.object({
  string: z.string(),
  number: z.number(),
  bigint: z.bigint(),
  date: z.date(),
  symbol: z.symbol(),
  undefined: z.undefined(),
  null: z.null(),
  nan: z.nan(),
  void: z.void(),
  any: z.any(),
  unknown: z.unknown(),
  never: z.never(),
  enum: z.enum(['foo', 'bar', 'baz']),
  nativeEnum: z.nativeEnum(NativeEnum),
  nullable: z.nullable(z.string())
});

export const complexZodSchema = z.object({
  primitives,
  objects: z.object({
    primitives
  }),
  arrays: z.array(primitives),
  tuples: z.tuple([z.string(), z.number()]),
  unions: z.union([z.string(), z.number()]),
  discriminatedUnions: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('object1'),
      foo: z.string(),
      bar: z.number()
    }),
    z.object({
      type: z.literal('object2'),
      foo: z.number(),
      bar: z.boolean()
    })
  ]),
  record: z.record(z.string()),
  maps: z.map(z.string(), z.number()),
  sets: z.set(z.string()),
  intersections: z.intersection(
    z.object({
      name: z.string()
    }),
    z.object({
      role: z.string()
    })
  )
});

const primitivesData = {
  string: 'foo',
  number: 123,
  bigint: BigInt(123),
  date: new Date('2021-01-01'),
  symbol: Symbol('foo'),
  undefined,
  null: null,
  nan: NaN,
  void: undefined,
  any: 'any',
  unknown: 'unknown',
  never: z.NEVER,
  enum: 'foo' as 'foo' | 'bar' | 'baz',
  nativeEnum: NativeEnum.Foo,
  nullable: 'foo'
};

export const complexSchemaData = {
  primitives: primitivesData,
  objects: {
    primitives: primitivesData
  },
  arrays: [primitivesData],
  tuples: ['foo', 123] as [string, number],
  unions: 'foo',
  discriminatedUnions: { type: 'object1', foo: 'foo', bar: 123 } as const,
  record: { key: 'value' },
  maps: new Map().set('foo', 123),
  sets: new Set('foo'),
  intersections: { name: 'John', role: 'Admin' }
};

export const expectComplexSchemaResponse = (paths: Record<string, unknown>) => {
  const primitives = {
    type: 'object',
    properties: {
      string: { type: 'string' },
      number: { type: 'number' },
      bigint: { type: 'number' },
      date: { type: 'string', format: 'date-time' },
      symbol: { type: 'string' },
      undefined: { type: 'null' },
      null: { type: 'null' },
      nan: { type: 'null' },
      void: { type: 'null' },
      any: {},
      unknown: {},
      never: { type: 'null' },
      enum: { enum: ['foo', 'bar', 'baz'] },
      nativeEnum: { enum: ['foo', 'bar', 'baz'] },
      nullable: { type: ['string', 'null'] }
    }
  };

  const schema = {
    type: 'object',
    properties: {
      primitives,
      objects: {
        type: 'object',
        properties: {
          primitives
        }
      },
      arrays: {
        type: 'array',
        items: primitives
      },
      tuples: {
        type: 'array',
        items: [{ type: 'string' }, { type: 'number' }]
      },
      unions: { anyOf: [{ type: 'string' }, { type: 'number' }] },
      discriminatedUnions: {
        oneOf: [
          {
            type: 'object',
            properties: {
              type: { enum: ['object1'], type: 'string' },
              foo: { type: 'string' },
              bar: { type: 'number' }
            }
          },
          {
            type: 'object',
            properties: {
              type: { enum: ['object2'], type: 'string' },
              foo: { type: 'number' },
              bar: { type: 'boolean' }
            }
          }
        ]
      },
      record: {
        type: 'object',
        additionalProperties: { type: 'string' }
      },
      maps: {
        type: 'object',
        additionalProperties: { type: 'number' }
      },
      sets: {
        type: 'array',
        items: { type: 'string' },
        uniqueItems: true
      },
      intersections: {
        allOf: [
          {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          },
          {
            type: 'object',
            properties: {
              role: { type: 'string' }
            }
          }
        ]
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
