import {
  DEFAULT_ERRORS,
  FORM_DATA_CONTENT_TYPES_THAT_SUPPORT_VALIDATION
} from '../constants';
import {
  validateSchema,
  logNextRestFrameworkError,
  logPagesEdgeRuntimeErrorForRoute
} from '../shared';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import {
  type FormDataContentType,
  type BaseOptions,
  type OpenApiPathItem
} from '../types';
import {
  type TypedNextApiRequest,
  type ApiRouteOperationDefinition
} from './api-route-operation';
import { type NextRequest } from 'next/server';
import { getPathsFromRoute } from '../shared/paths';

export const apiRoute = <T extends Record<string, ApiRouteOperationDefinition>>(
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
          status: 500
        }
      );
    }

    try {
      const operation = Object.entries(operations).find(
        ([_operationId, operation]) => operation.method === req.method
      )?.[1];

      if (!operation) {
        res.setHeader(
          'Allow',
          Object.values(operations)
            .map(({ method }) => method)
            .join(', ')
        );

        res.status(405).json({ message: DEFAULT_ERRORS.methodNotAllowed });
        return;
      }

      const { input, handler, middleware1, middleware2, middleware3 } =
        operation;

      let middlewareOptions: BaseOptions = {};

      if (middleware1) {
        const res1 = await middleware1(req, res, middlewareOptions);

        const isOptionsResponse = (res: unknown): res is BaseOptions =>
          typeof res === 'object';

        if (res.writableEnded) {
          return;
        } else if (isOptionsResponse(res1)) {
          middlewareOptions = res1;

          if (middleware2) {
            const res2 = await middleware2(req, res, middlewareOptions);

            if (res.writableEnded) {
              return;
            } else if (isOptionsResponse(res2)) {
              middlewareOptions = res2;

              if (middleware3) {
                const res3 = await middleware3(req, res, middlewareOptions);

                if (res.writableEnded) {
                  return;
                } else if (isOptionsResponse(res3)) {
                  middlewareOptions = res3;
                }
              }
            }
          }
        }
      }

      if (input) {
        const {
          body: bodySchema,
          query: querySchema,
          contentType: contentTypeSchema
        } = input;

        const contentType = req.headers['content-type']?.split(';')[0];

        if (contentTypeSchema && contentType !== contentTypeSchema) {
          res.status(415).json({
            message: `${DEFAULT_ERRORS.invalidMediaType} Expected ${contentTypeSchema}.`
          });

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
              } catch (e) {
                res.status(400).json({
                  message: `${DEFAULT_ERRORS.invalidRequestBody} Failed to parse form data.`
                });

                return;
              }
            }

            try {
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

              const formData = new FormData();

              Object.entries(data).forEach(([key, value]) => {
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

        if (querySchema) {
          const { valid, errors, data } = validateSchema({
            schema: querySchema,
            obj: req.query
          });

          if (!valid) {
            res.status(400).json({
              message: DEFAULT_ERRORS.invalidQueryParameters,
              errors
            });

            return;
          }

          req.query = data;
        }
      }

      await handler?.(req as TypedNextApiRequest, res, middlewareOptions);

      if (!res.writableEnded) {
        res.status(501).json({ message: DEFAULT_ERRORS.notImplemented });
      }
    } catch (error) {
      logNextRestFrameworkError(error);
      res.status(500).json({ message: DEFAULT_ERRORS.unexpectedError });
    }
  };

  handler._getPathsForRoute = async (route: string) => {
    return getPathsFromRoute({
      operations,
      options,
      route
    });
  };

  return handler;
};
