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
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { type OpenApiOperation, type OpenApiPathItem } from '../types';
import { type RpcClient } from '../client/rpc-client';

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
    try {
      const { method, body, headers, url: pathname } = req;

      if (method !== ValidMethod.POST) {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ message: DEFAULT_ERRORS.methodNotAllowed });
        return;
      }

      if (
        process.env.NODE_ENV !== 'production' &&
        headers['user-agent'] === NEXT_REST_FRAMEWORK_USER_AGENT
      ) {
        const route = decodeURIComponent(pathname ?? '').replace(
          '/{operationId}',
          ''
        );

        try {
          const nrfOasData = getOasDataFromRpcOperations({
            operations,
            options,
            route
          });

          res.status(200).json({ nrfOasData });
          return;
        } catch (error) {
          throw Error(`OpenAPI spec generation failed for route: ${route}
${error}`);
        }
      }

      const operation = operations[req.query.operationId?.toString() ?? ''];

      if (!operation) {
        res.status(400).json({ message: DEFAULT_ERRORS.operationNotAllowed });
        return;
      }

      const { input, handler, middleware } = operation._meta;

      if (middleware) {
        const _res = await middleware(body);

        if (_res) {
          res.status(200).json(_res);
          return;
        }
      }

      if (input) {
        if (headers['content-type']?.split(';')[0] !== 'application/json') {
          res.status(415).json({ message: DEFAULT_ERRORS.invalidMediaType });
        }

        try {
          const { valid, errors } = await validateSchema({
            schema: input,
            obj: body
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

      if (!handler) {
        throw Error(DEFAULT_ERRORS.handlerNotFound);
      }

      const _res = await handler(body);
      res.status(200).json(_res);
    } catch (error) {
      logNextRestFrameworkError(error);
      res.status(500).json({ message: DEFAULT_ERRORS.unexpectedError });
    }
  };

  handler._getPaths = (route: string) =>
    getOasDataFromRpcOperations({
      operations,
      options,
      route
    });

  handler.client = operations as RpcClient<T>;

  return handler;
};
