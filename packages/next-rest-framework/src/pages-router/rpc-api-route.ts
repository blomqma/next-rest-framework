import { DEFAULT_ERRORS, ValidMethod } from '../constants';
import {
  validateSchema,
  logNextRestFrameworkError,
  type RpcOperationDefinition,
  logPagesEdgeRuntimeErrorForRoute
} from '../shared';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import {
  type BaseOptions,
  type OpenApiOperation,
  type OpenApiPathItem
} from '../types';
import { type RpcClient } from '../client/rpc-client';
import { type NextRequest } from 'next/server';
import { getPathsFromRpcRoute } from '../shared/paths';

export const rpcApiRoute = <
  T extends Record<string, RpcOperationDefinition<any, any, any>>
>(
  operations: T,
  options?: {
    openApiPath?: OpenApiPathItem;
    openApiOperation?: OpenApiOperation;
  }
) => {
  const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (typeof EdgeRuntime === 'string') {
      const edgeRequest = req as unknown as NextRequest;
      const route = decodeURIComponent(edgeRequest.nextUrl.pathname ?? '');
      logPagesEdgeRuntimeErrorForRoute(route);

      return Response.json(
        { message: DEFAULT_ERRORS.unexpectedError },
        {
          status: 400
        }
      );
    }

    try {
      if (req.method !== ValidMethod.POST) {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ message: DEFAULT_ERRORS.methodNotAllowed });
        return;
      }

      const operation = operations[req.query.operationId?.toString() ?? ''];

      if (!operation) {
        res.status(400).json({ message: DEFAULT_ERRORS.operationNotAllowed });
        return;
      }

      const { input, handler, middleware1, middleware2, middleware3 } =
        operation._meta;

      let middlewareOptions: BaseOptions = {};

      if (middleware1) {
        middlewareOptions = await middleware1(req.body, {});

        if (middleware2) {
          middlewareOptions = await middleware2(req.body, middlewareOptions);

          if (middleware3) {
            middlewareOptions = await middleware3(req.body, middlewareOptions);
          }
        }
      }

      if (input) {
        if (req.headers['content-type']?.split(';')[0] !== 'application/json') {
          res.status(400).json({ message: DEFAULT_ERRORS.invalidMediaType });
        }

        try {
          const { valid, errors } = await validateSchema({
            schema: input,
            obj: req.body
          });

          if (!valid) {
            res.status(400).json({
              message: DEFAULT_ERRORS.invalidRequestBody,
              errors
            });

            return;
          }
        } catch (error) {
          res.status(400).json({
            message: DEFAULT_ERRORS.missingRequestBody
          });

          return;
        }
      }

      const _res = await handler?.(req.body, middlewareOptions);

      if (!_res) {
        res.status(400).json({ message: DEFAULT_ERRORS.notImplemented });
        return;
      }

      res.status(200).json(_res);
    } catch (error) {
      logNextRestFrameworkError(error);
      res.status(400).json({ message: DEFAULT_ERRORS.unexpectedError });
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

  return handler;
};
