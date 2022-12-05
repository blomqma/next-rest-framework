import { createMocks, RequestOptions, ResponseOptions } from 'node-mocks-http';
import { TypedNextApiRequest, TypedNextApiResponse } from '../src/types';
import { Modify } from '../src/utility-types';

export const resetCustomGlobals = () => {
  global.nextRestFrameworkConfig = undefined;
  global.reservedPathsLogged = false;
  global.reservedOpenApiJsonPathWarningLogged = false;
  global.reservedOpenApiYamlPathWarningLogged = false;
  global.reservedSwaggerUiPathWarningLogged = false;
};

export const createNextRestFrameworkMocks = <Body>(
  reqOptions?: Modify<RequestOptions, { body?: Body }>,
  resOptions?: ResponseOptions
) =>
  createMocks<
    // @ts-expect-error: Our custom response types are not compatible with node-mocks-http.
    TypedNextApiRequest<Body>,
    // @ts-expect-error: Same as above.
    TypedNextApiResponse
  >(reqOptions as RequestOptions, resOptions);
