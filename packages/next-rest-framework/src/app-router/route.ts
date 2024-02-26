import { NextRequest, NextResponse } from 'next/server';
import qs from 'qs';
import { DEFAULT_ERRORS } from '../constants';
import { validateSchema } from '../shared';
import { logNextRestFrameworkError } from '../shared/logging';
import { getPathsFromRoute } from '../shared/paths';
import {
  type BaseOptions,
  type BaseParams,
  type OpenApiPathItem
} from '../types';
import {
  type RouteOperationDefinition,
  type TypedNextRequest
} from './route-operation';

export const route = <T extends Record<string, RouteOperationDefinition>>(
  operations: T,
  options?: {
    openApiPath?: OpenApiPathItem;
  }
) => {
  const handler = async (req: NextRequest, context: { params: BaseParams }) => {
    try {
      const operation = Object.entries(operations).find(
        ([_operationId, operation]) => operation.method === req.method
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

      let middlewareOptions: BaseOptions = {};

      if (middleware1) {
        const res = await middleware1(
          new NextRequest(req.clone()),
          context,
          middlewareOptions
        );

        const isOptionsResponse = (res: unknown): res is BaseOptions =>
          typeof res === 'object';

        if (res instanceof Response) {
          return res;
        } else if (isOptionsResponse(res)) {
          middlewareOptions = res;
        }

        if (middleware2) {
          const res2 = await middleware2(
            new NextRequest(req.clone()),
            context,
            middlewareOptions
          );

          if (res2 instanceof Response) {
            return res2;
          } else if (isOptionsResponse(res2)) {
            middlewareOptions = res2;
          }

          if (middleware3) {
            const res3 = await middleware3(
              new NextRequest(req.clone()),
              context,
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
        const { body: bodySchema, query: querySchema, contentType } = input;

        if (
          contentType &&
          req.headers.get('content-type')?.split(';')[0] !== contentType
        ) {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.invalidMediaType },
            { status: 415 }
          );
        }

        if (bodySchema) {
          try {
            const reqClone = req.clone();
            const body = await reqClone.json();

            const { valid, errors } = await validateSchema({
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

        if (querySchema) {
          const { valid, errors } = await validateSchema({
            schema: querySchema,
            obj: qs.parse(req.nextUrl.search, { ignoreQueryPrefix: true })
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
        }
      }

      const res = await handler?.(
        req as TypedNextRequest,
        context,
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
