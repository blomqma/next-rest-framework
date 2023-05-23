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

export const complexZodSchema = z.object({
  name: z.string(),
  age: z.number(),
  isCool: z.boolean(),
  hobbies: z.array(
    z.object({
      name: z.string(),
      properties: z.object({
        foo: z.string()
      })
    })
  )
});

export const complexSchemaData = {
  name: 'foo',
  age: 1,
  isCool: true,
  hobbies: [{ name: 'bar', properties: { foo: 'bar' } }]
};
