import {
  type ApiRouteOperation,
  type InputObject,
  type OutputObject,
  type ApiRouteOperationDefinition
} from '../types';
import { type NextApiHandler } from 'next/types';

export const apiRouteOperation: ApiRouteOperation = (openApiOperation) => {
  const createConfig = <Middleware, Handler>(
    input: InputObject | undefined,
    output: readonly OutputObject[] | undefined,
    middleware: Middleware | undefined,
    handler: Handler | undefined
  ): ApiRouteOperationDefinition => ({
    _config: {
      openApiOperation,
      input,
      output,
      middleware: middleware as NextApiHandler,
      handler: handler as NextApiHandler
    }
  });

  return {
    input: (input) => ({
      output: (output) => ({
        middleware: (middleware) => ({
          handler: (handler) => createConfig(input, output, middleware, handler)
        }),
        handler: (handler) => createConfig(input, output, undefined, handler)
      }),
      middleware: (middleware) => ({
        output: (output) => ({
          handler: (handler) => createConfig(input, output, middleware, handler)
        }),
        handler: (handler) =>
          createConfig(input, undefined, middleware, handler)
      }),
      handler: (handler) => createConfig(input, undefined, undefined, handler)
    }),
    output: (output) => ({
      middleware: (middleware) => ({
        handler: (handler) =>
          createConfig(undefined, output, middleware, handler)
      }),
      handler: (handler) => createConfig(undefined, output, undefined, handler)
    }),
    middleware: (middleware) => ({
      handler: (handler) =>
        createConfig(undefined, undefined, middleware, handler)
    }),
    handler: (handler) => createConfig(undefined, undefined, undefined, handler)
  };
};
