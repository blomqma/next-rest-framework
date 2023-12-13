import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from '../constants';
import { type OpenApiPathItem, type BaseParams } from '../types';
import {
  isValidMethod,
  validateSchema,
  logNextRestFrameworkError,
  getOasDataFromOperations
} from '../shared';
import { type RouteOperationDefinition } from './route-operation';

export const route = <T extends Record<string, RouteOperationDefinition>>(
  operations: T,
  options?: {
    openApiPath?: OpenApiPathItem;
  }
) => {
  const handler = async (req: NextRequest, context: { params: BaseParams }) => {
    try {
      const { method, headers, nextUrl } = req;
      const { pathname } = nextUrl;

      const handleMethodNotAllowed = () => {
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
      };

      if (!isValidMethod(method)) {
        return handleMethodNotAllowed();
      }

      if (
        process.env.NODE_ENV !== 'production' &&
        headers.get('user-agent') === NEXT_REST_FRAMEWORK_USER_AGENT
      ) {
        const route = decodeURIComponent(pathname ?? '');

        try {
          const nrfOasData = getOasDataFromOperations({
            operations,
            options,
            route
          });

          return NextResponse.json({ nrfOasData }, { status: 200 });
        } catch (error) {
          throw Error(`OpenAPI spec generation failed for route: ${route}
${error}`);
        }
      }

      const operation = Object.entries(operations).find(
        ([_operationId, operation]) => operation.method === method
      )?.[1];

      if (!operation) {
        return handleMethodNotAllowed();
      }

      const { input, handler, middleware } = operation;

      if (middleware) {
        const res = await middleware(new NextRequest(req.clone()), context);

        if (res) {
          return res;
        }
      }

      if (input) {
        const { body: bodySchema, query: querySchema, contentType } = input;

        if (
          contentType &&
          headers.get('content-type')?.split(';')[0] !== contentType
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
            obj: Object.fromEntries(new URLSearchParams(req.nextUrl.search))
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

      if (!handler) {
        throw Error(DEFAULT_ERRORS.handlerNotFound);
      }

      const res = await handler(req, context);
      return res;
    } catch (error) {
      logNextRestFrameworkError(error);
      return NextResponse.json(
        { message: DEFAULT_ERRORS.unexpectedError },
        { status: 500 }
      );
    }
  };

  handler._getPaths = (route: string) =>
    getOasDataFromOperations({
      operations,
      options,
      route
    });

  // Map all methods for App Router.
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
