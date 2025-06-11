import { NextRequest, NextResponse } from 'next/server';
import qs from 'qs';
import { DEFAULT_ERRORS } from '../constants';
import { validateSchema } from '../shared';
import { logNextRestFrameworkError } from '../shared/logging';
import { getPathsFromRoute } from '../shared/paths';
import {
  type FormDataContentType,
  type BaseOptions,
  type BaseParams,
  type OpenApiPathItem
} from '../types';
import {
  type RouteOperationDefinition,
  type TypedNextRequest
} from './route-operation';

const FORM_DATA_CONTENT_TYPES: FormDataContentType[] = [
  'multipart/form-data',
  'application/x-www-form-urlencoded'
];

export const route = <T extends Record<string, RouteOperationDefinition>>(
  operations: T,
  options?: {
    openApiPath?: OpenApiPathItem;
  }
) => {
  const handler = async (
    _req: NextRequest,
    context: { params: Promise<BaseParams> }
  ) => {
    try {
      const operation = Object.entries(operations).find(
        ([_operationId, operation]) => operation.method === _req.method
      )?.[1];

      if (!operation) {
        return NextResponse.json(
          { message: DEFAULT_ERRORS.methodNotAllowed },
          {
            status: 405,
            headers: {
              Allow: Object.values(operations)
                .map(({ method }) => method)
                .join(', ')
            }
          }
        );
      }

      const { input, handler, middleware1, middleware2, middleware3 } =
        operation;

      const _reqClone = _req.clone() as NextRequest;

      let reqClone = new NextRequest(_reqClone.url, {
        method: _reqClone.method,
        headers: _reqClone.headers
      });

      reqClone.json = async () => await _req.clone().json();
      reqClone.formData = async () => await _req.clone().formData();

      let middlewareOptions: BaseOptions = {};

      if (middleware1) {
        const res = await middleware1(reqClone, {...context, params: await context.params}, middlewareOptions);

        const isOptionsResponse = (res: unknown): res is BaseOptions =>
          typeof res === 'object';

        if (res instanceof Response) {
          return res;
        } else if (isOptionsResponse(res)) {
          middlewareOptions = res;
        }

        if (middleware2) {
          const res2 = await middleware2(reqClone, {...context, params: await context.params}, middlewareOptions);

          if (res2 instanceof Response) {
            return res2;
          } else if (isOptionsResponse(res2)) {
            middlewareOptions = res2;
          }

          if (middleware3) {
            const res3 = await middleware3(
              reqClone,
              {...context, params: await context.params},
              middlewareOptions
            );

            if (res3 instanceof Response) {
              return res3;
            } else if (isOptionsResponse(res3)) {
              middlewareOptions = res3;
            }
          }
        }
      }

      if (input) {
        const {
          body: bodySchema,
          query: querySchema,
          contentType: contentTypeSchema,
          params: paramsSchema
        } = input;

        const contentType = reqClone.headers.get('content-type')?.split(';')[0];

        if (contentTypeSchema && contentType !== contentTypeSchema) {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.invalidMediaType },
            { status: 415, headers: { Allow: contentTypeSchema } }
          );
        }

        if (bodySchema) {
          if (contentType === 'application/json') {
            try {
              const json = await reqClone.json();

              const { valid, errors, data } = validateSchema({
                schema: bodySchema,
                obj: json
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

              reqClone = new NextRequest(reqClone.url, {
                method: reqClone.method,
                headers: reqClone.headers,
                body: JSON.stringify(data)
              });

              reqClone.json = async () => data;
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
          }

          if (
            FORM_DATA_CONTENT_TYPES.includes(contentType as FormDataContentType)
          ) {
            try {
              const formData = await reqClone.formData();

              const { valid, errors, data } = validateSchema({
                schema: bodySchema,
                obj: formData
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

              // Inject parsed for data to JSON body.
              reqClone = new NextRequest(reqClone.url, {
                method: reqClone.method,
                headers: reqClone.headers,
                body: JSON.stringify(data)
              });

              // Return parsed form data.
              reqClone.formData = async () => {
                const formData = new FormData();

                for (const [key, value] of Object.entries(data)) {
                  formData.append(key, value as string | Blob);
                }

                return formData;
              };
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

        if (querySchema) {
          const { valid, errors, data } = validateSchema({
            schema: querySchema,
            obj: qs.parse(reqClone.nextUrl.search, {
              ignoreQueryPrefix: true
            })
          });

          if (!valid) {
            return NextResponse.json(
              {
                message: DEFAULT_ERRORS.invalidQueryParameters,
                errors
              },
              {
                status: 400
              }
            );
          }

          const url = new URL(reqClone.url);

          // Update the query parameters
          url.searchParams.forEach((_value, key) => {
            url.searchParams.delete(key);

            if (data[key]) {
              url.searchParams.append(key, data[key]);
            }
          });

          reqClone = new NextRequest(url, {
            method: reqClone.method,
            headers: reqClone.headers,
            body: reqClone.body
          });
        }

        if (paramsSchema) {
          const { valid, errors, data } = validateSchema({
            schema: paramsSchema,
            obj: await context.params
          });

          if (!valid) {
            return NextResponse.json(
              {
                message: DEFAULT_ERRORS.invalidPathParameters,
                errors
              },
              {
                status: 400
              }
            );
          }

          context.params = data;
        }
      }

      const res = await handler?.(
        reqClone as TypedNextRequest,
        {...context, params: await context.params},
        middlewareOptions
      );

      if (!res) {
        return NextResponse.json(
          { message: DEFAULT_ERRORS.notImplemented },
          { status: 501 }
        );
      }

      return res;
    } catch (error) {
      logNextRestFrameworkError(error);
      return NextResponse.json(
        { message: DEFAULT_ERRORS.unexpectedError },
        { status: 500 }
      );
    }
  };

  handler._getPathsForRoute = async (route: string) => {
    return getPathsFromRoute({
      operations,
      options,
      route
    });
  };

  // Map all methods for app router.
  const api = Object.values(operations).reduce(
    (acc, operation) => {
      acc[operation.method as keyof typeof acc] = handler;
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/prefer-reduce-type-parameter
    {} as { [key in T[keyof T]['method']]: typeof handler }
  ) as { [key in T[keyof T]['method']]: typeof handler };

  return api;
};
