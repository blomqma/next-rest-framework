import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from '../constants';
import { type BaseQuery } from '../types';
import {
  getPathsFromMethodHandlers,
  isValidMethod,
  validateSchema,
  logNextRestFrameworkError
} from '../shared';

import { type ValidMethod } from '../constants';

import { type OpenAPIV3_1 } from 'openapi-types';

import { type RouteOperationDefinition } from './route-operation';

export interface RouteParams {
  openApiPath?: OpenAPIV3_1.PathItemObject;
  [ValidMethod.GET]?: RouteOperationDefinition;
  [ValidMethod.PUT]?: RouteOperationDefinition;
  [ValidMethod.POST]?: RouteOperationDefinition;
  [ValidMethod.DELETE]?: RouteOperationDefinition;
  [ValidMethod.OPTIONS]?: RouteOperationDefinition;
  [ValidMethod.HEAD]?: RouteOperationDefinition;
  [ValidMethod.PATCH]?: RouteOperationDefinition;
}

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
          const nrfOasData = getPathsFromMethodHandlers({
            methodHandlers,
            route
          });

          return NextResponse.json({ nrfOasData }, { status: 200 });
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

  handler.getPaths = (route: string) =>
    getPathsFromMethodHandlers({
      methodHandlers,
      route
    });

  return handler;
};
