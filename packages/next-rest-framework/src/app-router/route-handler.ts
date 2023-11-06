import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from '../constants';
import { type RouteParams, type BaseQuery } from '../types';
import {
  getPathsFromMethodHandlers,
  isValidMethod,
  validateSchema,
  logNextRestFrameworkError
} from '../utils';

export const routeHandler = (methodHandlers: RouteParams) => {
  const handler = async (req: NextRequest, context: { params: BaseQuery }) => {
    try {
      const { method, headers, nextUrl } = req;
      const { pathname } = nextUrl;

      const handleMethodNotAllowed = () => {
        return NextResponse.json(
          { message: DEFAULT_ERRORS.methodNotAllowed },
          {
            status: 405,
            headers: {
              Allow: Object.keys(methodHandlers).join(', ')
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
          const nextRestFrameworkPaths = getPathsFromMethodHandlers({
            methodHandlers,
            route
          });

          return NextResponse.json({ nextRestFrameworkPaths }, { status: 200 });
        } catch (error) {
          throw Error(`OpenAPI spec generation failed for route: ${route}
${error}`);
        }
      }

      const methodHandler = methodHandlers[method];

      if (!methodHandler) {
        return handleMethodNotAllowed();
      }

      const { input, handler, middleware } = methodHandler._config;

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
                  message: 'Invalid request body.',
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
                message: 'Missing request body.'
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
                message: 'Invalid query parameters.',
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
        throw Error('Handler not found.');
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

  handler.getPaths = (route: string) =>
    getPathsFromMethodHandlers({
      methodHandlers,
      route
    });

  return handler;
};
