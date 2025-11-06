import {
  DEFAULT_ERRORS,
  FORM_DATA_CONTENT_TYPES_THAT_SUPPORT_VALIDATION,
  ValidMethod
} from '../constants';
import {
  validateSchema,
  logNextRestFrameworkError,
  type RpcOperationDefinition,
  logPagesEdgeRuntimeErrorForRoute,
  parseRpcOperationResponseJson
} from '../shared';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import {
  type FormDataContentType,
  type BaseOptions,
  type OpenApiPathItem
} from '../types';
import { type RpcClient } from '../client/rpc-client';
import { type NextRequest } from 'next/server';
import { getPathsFromRpcRoute } from '../shared/paths';

export const rpcApiRoute = <
  T extends Record<string, RpcOperationDefinition<any, any, any, any>>
>(
  operations: T,
  options?: {
    openApiPath?: OpenApiPathItem;
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
        const res1 = await middleware1(req.body, {});
        if (res1 && typeof res1 === 'object') middlewareOptions = res1 as BaseOptions;

        if (middleware2) {
          const res2 = await middleware2(req.body, middlewareOptions);
          if (res2 && typeof res2 === 'object') middlewareOptions = res2 as BaseOptions;

          if (middleware3) {
            const res3 = await middleware3(req.body, middlewareOptions);
            if (res3 && typeof res3 === 'object') middlewareOptions = res3 as BaseOptions;
          }
        }
      }

      if (input) {
        const { body: bodySchema, contentType: contentTypeSchema } = input;
        const contentType = req.headers['content-type']?.split(';')[0];

        if (contentType !== contentTypeSchema) {
          res.status(400).json({ message: DEFAULT_ERRORS.invalidMediaType });
          return;
        }

        if (bodySchema) {
          if (contentType === 'application/json') {
            const { valid, errors, data } = validateSchema({
              schema: bodySchema,
              obj: req.body
            });

            if (!valid) {
              res.status(400).json({
                message: DEFAULT_ERRORS.invalidRequestBody,
                errors
              });

              return;
            }

            req.body = data;
          }

          if (
            FORM_DATA_CONTENT_TYPES_THAT_SUPPORT_VALIDATION.includes(
              contentType as FormDataContentType
            )
          ) {
            if (
              contentType === 'multipart/form-data' &&
              !(req.body instanceof FormData) &&
              typeof EdgeRuntime !== 'string'
            ) {
              const { parseMultiPartFormData } = await import(
                '../shared/form-data'
              );

              // Parse multipart/form-data into a FormData object.
              try {
                req.body = await parseMultiPartFormData(req);
              } catch {
                res.status(400).json({
                  message: `${DEFAULT_ERRORS.invalidRequestBody} Failed to parse form data.`
                });

                return;
              }
            }

            try {
              const result = validateSchema({
                schema: bodySchema,
                obj: req.body
              });

              if (!result.valid) {
                res.status(400).json({
                  message: DEFAULT_ERRORS.invalidRequestBody,
                  errors: result.errors
                });

                return;
              }

              const formData = new FormData();

              Object.entries(result.data as Record<string, unknown>).forEach(([key, value]) => {
                formData.append(key, value as string | Blob);
              });

              req.body = formData;
            } catch {
              res.status(400).json({
                message: `${DEFAULT_ERRORS.invalidRequestBody} Failed to parse form data.`
              });

              return;
            }
          }
        }
      }

      const _res = await handler?.(req.body, middlewareOptions);

      if (!_res) {
        res.status(400).json({ message: DEFAULT_ERRORS.notImplemented });
        return;
      }

      if (_res instanceof Blob) {
        const reader = _res.stream().getReader();
        res.setHeader('Content-Type', 'application/octet-stream');

        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${_res.name}"`
        );

        const pump = async () => {
          await reader.read().then(async ({ done, value }) => {
            if (done) {
              res.end();
              return;
            }

            res.write(value);
            await pump();
          });
        };

        await pump();
      }

      const json = await parseRpcOperationResponseJson(_res);
      res.status(200).json(json);
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
