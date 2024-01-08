import { type NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ERRORS,
  NEXT_REST_FRAMEWORK_USER_AGENT,
  ValidMethod
} from '../constants';
import {
  validateSchema,
  logNextRestFrameworkError,
  type RpcOperationDefinition,
  getOasDataFromRpcOperations
} from '../shared';
import {
  type BaseOptions,
  type BaseParams,
  type OpenApiPathItem
} from '../types';
import { type RpcClient } from '../client/rpc-client';

export const rpcRoute = <
  T extends Record<string, RpcOperationDefinition<any, any, any>>
>(
  operations: T,
  options?: {
    openApiPath?: OpenApiPathItem;
  }
) => {
  const handler = async (
    req: NextRequest,
    { params }: { params: BaseParams }
  ) => {
    try {
      const { method, headers, nextUrl } = req;
      const { pathname } = nextUrl;

      if (method !== ValidMethod.POST) {
        return NextResponse.json(
          { message: DEFAULT_ERRORS.methodNotAllowed },
          {
            status: 405,
            headers: {
              Allow: 'POST'
            }
          }
        );
      }

      if (
        process.env.NODE_ENV !== 'production' &&
        headers.get('user-agent') === NEXT_REST_FRAMEWORK_USER_AGENT
      ) {
        const route = decodeURIComponent(pathname ?? '').replace(
          '/{operationId}',
          ''
        );

        try {
          const nrfOasData = getOasDataFromRpcOperations({
            operations,
            route,
            options
          });

          return NextResponse.json({ nrfOasData }, { status: 200 });
        } catch (error) {
          throw Error(`OpenAPI spec generation failed for route: ${route}
${error}`);
        }
      }

      const operation = operations[params.operationId];

      if (!operation) {
        return NextResponse.json(
          { message: DEFAULT_ERRORS.operationNotAllowed },
          {
            status: 400
          }
        );
      }

      const { input, handler, middleware1, middleware2, middleware3 } =
        operation._meta;

      let middlewareOptions: BaseOptions = {};

      if (middleware1) {
        const body = req.clone().body;

        middlewareOptions = await middleware1(body, middlewareOptions);

        if (middleware2) {
          middlewareOptions = await middleware2(body, middlewareOptions);

          if (middleware3) {
            middlewareOptions = await middleware3(body, middlewareOptions);
          }
        }
      }

      if (input) {
        if (headers.get('content-type')?.split(';')[0] !== 'application/json') {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.invalidMediaType },
            { status: 415 }
          );
        }

        try {
          const reqClone = req.clone();
          const body = await reqClone.json();

          const { valid, errors } = await validateSchema({
            schema: input,
            obj: body
          });

          if (!valid) {
            return NextResponse.json(
              {
                message: DEFAULT_ERRORS.invalidRequestBody,
                errors
              },
              {
                status: 400
              }
            );
          }
        } catch (error) {
          return NextResponse.json(
            {
              message: DEFAULT_ERRORS.missingRequestBody
            },
            {
              status: 400
            }
          );
        }
      }

      if (!handler) {
        throw Error(DEFAULT_ERRORS.handlerNotFound);
      }

      const res = await handler(req.clone().body, middlewareOptions);
      return NextResponse.json(res, { status: 200 });
    } catch (error) {
      logNextRestFrameworkError(error);

      return NextResponse.json(
        { message: DEFAULT_ERRORS.unexpectedError },
        { status: 500 }
      );
    }
  };

  handler._getPaths = (route: string) =>
    getOasDataFromRpcOperations({
      operations,
      options,
      route
    });

  return { POST: handler, client: operations as RpcClient<T> };
};
