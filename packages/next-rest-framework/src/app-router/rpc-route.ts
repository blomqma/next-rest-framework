import { type NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ERRORS,
  FORM_DATA_CONTENT_TYPES_THAT_SUPPORT_VALIDATION,
  ValidMethod
} from '../constants';
import {
  validateSchema,
  logNextRestFrameworkError,
  type RpcOperationDefinition,
  parseRpcOperationResponseJson
} from '../shared';
import {
  type FormDataContentType,
  type BaseOptions,
  type BaseParams,
  type OpenApiPathItem
} from '../types';
import { type RpcClient } from '../client/rpc-client';
import { getPathsFromRpcRoute } from '../shared/paths';

export const rpcRoute = <
  T extends Record<string, RpcOperationDefinition<any, any, any, any>>
>(
  operations: T,
  options?: {
    openApiPath?: OpenApiPathItem;
  }
) => {
  const handler = async (
    req: NextRequest,
    { params }: { params: Promise<BaseParams> }
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

      const operation = operations[(await params).operationId ?? ''];

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

      const contentType = req.headers.get('content-type')?.split(';')[0];

      const parseRequestBody = async () => {
        if (contentType === 'application/json') {
          try {
            return await req.clone().json();
          } catch {
            return {};
          }
        }

        if (
          FORM_DATA_CONTENT_TYPES_THAT_SUPPORT_VALIDATION.includes(
            contentType as FormDataContentType
          )
        ) {
          try {
            return await req.clone().formData();
          } catch {
            return {};
          }
        }

        return {};
      };

      let body = await parseRequestBody();
      let middlewareOptions: BaseOptions = {};

      if (middleware1) {
        middlewareOptions = await middleware1(body, middlewareOptions);

        if (middleware2) {
          middlewareOptions = await middleware2(body, middlewareOptions);

          if (middleware3) {
            middlewareOptions = await middleware3(body, middlewareOptions);
          }
        }
      }

      if (input) {
        const { contentType: contentTypeSchema, body: bodySchema } = input;

        if (contentTypeSchema && contentType !== contentTypeSchema) {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.invalidMediaType },
            { status: 400 }
          );
        }

        if (bodySchema) {
          if (contentType === 'application/json') {
            try {
              const { valid, errors, data } = validateSchema({
                schema: bodySchema,
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

              body = data;
            } catch {
              return NextResponse.json(
                {
                  message: `${DEFAULT_ERRORS.invalidRequestBody} Failed to parse JSON body.`
                },
                {
                  status: 400
                }
              );
            }

            if (
              FORM_DATA_CONTENT_TYPES_THAT_SUPPORT_VALIDATION.includes(
                contentType as FormDataContentType
              )
            ) {
              try {
                const { valid, errors, data } = validateSchema({
                  schema: bodySchema,
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

                const formData = new FormData();

                for (const [key, value] of Object.entries(data)) {
                  formData.append(key, value as string | Blob);
                }

                body = formData;
              } catch {
                return NextResponse.json(
                  {
                    message: `${DEFAULT_ERRORS.invalidRequestBody} Failed to parse form data.`
                  },
                  {
                    status: 400
                  }
                );
              }
            }
          }
        }
      }

      const res = await handler?.(body, middlewareOptions);

      if (!res) {
        return NextResponse.json(
          { message: DEFAULT_ERRORS.notImplemented },
          { status: 400 }
        );
      }

      const parseRes = async (res: unknown): Promise<BodyInit> => {
        if (res instanceof ReadableStream || res instanceof Blob) {
          return res;
        }

        const parsed = await parseRpcOperationResponseJson(res);
        return JSON.stringify(parsed);
      };

      const json = await parseRes(res);

      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
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
