import { createMocks, RequestOptions, ResponseOptions } from 'node-mocks-http';
import {
  Modify,
  TypedNextApiRequest,
  TypedNextApiResponse
} from '../src/types';
import { z } from 'zod';

export const resetCustomGlobals = () => {
  global.nextRestFrameworkConfig = undefined;
  global.reservedPathsLogged = false;
  global.reservedOpenApiJsonPathWarningLogged = false;
  global.reservedOpenApiYamlPathWarningLogged = false;
  global.reservedSwaggerUiPathWarningLogged = false;
};

export const createNextRestFrameworkMocks = <
  Body,
  Params = Partial<{
    [key: string]: string | string[];
  }>
>(
  reqOptions?: Modify<RequestOptions, { body?: Body; query?: Params }>,
  resOptions?: ResponseOptions
) =>
  createMocks<
    // @ts-expect-error: Our custom response types are not compatible with node-mocks-http.
    TypedNextApiRequest<Body, Params>,
    // @ts-expect-error: Same as above.
    TypedNextApiResponse
  >(reqOptions as RequestOptions, resOptions);

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
