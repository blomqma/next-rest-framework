import {
  type RouteOperation,
  type RouteOperationDefinition,
  type InputObject,
  type OutputObject,
  type NextRouteHandler
} from '../types';

export const routeOperation: RouteOperation = (openApiOperation) => {
  const createConfig = <Middleware, Handler>(
    input: InputObject | undefined,
    output: readonly OutputObject[] | undefined,
    middleware: Middleware | undefined,
    handler: Handler | undefined
  ): RouteOperationDefinition => ({
    _config: {
      openApiOperation,
      input,
      output,
      middleware: middleware as NextRouteHandler,
      handler: handler as NextRouteHandler
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
