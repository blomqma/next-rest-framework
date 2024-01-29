import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS, ValidMethod } from '../constants';
import {
  validateSchema,
  logNextRestFrameworkError,
  type RpcOperationDefinition
} from '../shared';
import {
  type BaseOptions,
  type BaseParams,
  type OpenApiPathItem
} from '../types';
import { type RpcClient } from '../client/rpc-client';
import { getPathsFromRpcRoute } from '../shared/paths';

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
      if (req.method !== ValidMethod.POST) {
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

      const operation = operations[params.operationId ?? ''];

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
        if (
          req.headers.get('content-type')?.split(';')[0] !== 'application/json'
        ) {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.invalidMediaType },
            { status: 400 }
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

      const res = await handler?.(req.clone().body, middlewareOptions);

      if (!res) {
        return NextResponse.json(
          { message: DEFAULT_ERRORS.notImplemented },
          { status: 400 }
        );
      }

      return NextResponse.json(res, { status: 200 });
    } catch (error) {
      logNextRestFrameworkError(error);

      return NextResponse.json(
        { message: DEFAULT_ERRORS.unexpectedError },
        { status: 400 }
      );
    }
  };

  handler._getPathsForRoute = async (route: string) => {
    return getPathsFromRpcRoute({
      operations,
      options,
      route: route.replace('/{operationId}', '')
    });
  };

  handler.client = operations as RpcClient<T>;

  return {
    POST: handler
  };
};
