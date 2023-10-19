import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from './constants';
import {
  type RouteParams,
  type ApiRouteOperation,
  type ApiRouteParams,
  type RouteOperation,
  type OutputObject,
  type NextRouteHandler,
  type BaseQuery
} from './types';
import {
  getPathsFromMethodHandlers,
  isValidMethod,
  validateSchema
} from './utils';
import { logNextRestFrameworkError } from './utils/logging';
import {
  type NextApiHandler,
  type NextApiRequest,
  type NextApiResponse
} from 'next/types';

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

      if (headers.get('user-agent') === NEXT_REST_FRAMEWORK_USER_AGENT) {
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

      const { input, handler } = methodHandler._config;

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

export const routeOperation: RouteOperation = (openApiOperation) => {
  return {
    input: (input) => ({
      output: (output) => ({
        handler: (handler) => ({
          _config: {
            openApiOperation,
            input,
            output: output as OutputObject[] | undefined,
            handler: handler as NextRouteHandler | undefined
          }
        })
      }),
      handler: (handler) => ({
        _config: {
          openApiOperation,
          input,
          handler: handler as NextRouteHandler | undefined
        }
      })
    }),
    output: (output) => ({
      handler: (handler) => ({
        _config: {
          openApiOperation,
          output: output as OutputObject[] | undefined,
          handler: handler as NextRouteHandler | undefined
        }
      })
    }),
    handler: (handler) => ({
      _config: {
        openApiOperation,
        handler: handler as NextRouteHandler | undefined
      }
    })
  };
};

export const apiRouteHandler = (methodHandlers: ApiRouteParams) => {
  const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const { method, body, query, headers, url: pathname } = req;

      const handleMethodNotAllowed = () => {
        res.setHeader('Allow', Object.keys(methodHandlers).join(', '));
        res.status(405).json({ message: DEFAULT_ERRORS.methodNotAllowed });
      };

      if (!isValidMethod(method)) {
        handleMethodNotAllowed();
        return;
      }

      if (headers['user-agent'] === NEXT_REST_FRAMEWORK_USER_AGENT) {
        const route = decodeURIComponent(pathname ?? '');

        try {
          const nextRestFrameworkPaths = getPathsFromMethodHandlers({
            methodHandlers,
            route
          });

          res.status(200).json({ nextRestFrameworkPaths });
          return;
        } catch (error) {
          throw Error(`OpenAPI spec generation failed for route: ${route}
${error}`);
        }
      }

      const methodHandler = methodHandlers[method];

      if (!methodHandler) {
        handleMethodNotAllowed();
        return;
      }

      const { input, handler } = methodHandler._config;

      if (input) {
        const { body: bodySchema, query: querySchema, contentType } = input;

        if (
          contentType &&
          headers['content-type']?.split(';')[0] !== contentType
        ) {
          res.status(415).json({ message: DEFAULT_ERRORS.invalidMediaType });
          return;
        }

        if (bodySchema) {
          const { valid, errors } = await validateSchema({
            schema: bodySchema,
            obj: body
          });

          if (!valid) {
            res.status(400).json({
              message: 'Invalid request body.',
              errors
            });

            return;
          }
        }

        if (querySchema) {
          const { valid, errors } = await validateSchema({
            schema: querySchema,
            obj: query
          });

          if (!valid) {
            res.status(400).json({
              message: 'Invalid query parameters.',
              errors
            });

            return;
          }
        }
      }

      if (!handler) {
        throw Error('Handler not found.');
      }

      await handler(req, res);
    } catch (error) {
      logNextRestFrameworkError(error);
      res.status(500).json({ message: DEFAULT_ERRORS.unexpectedError });
    }
  };

  handler.getPaths = (route: string) =>
    getPathsFromMethodHandlers({
      methodHandlers,
      route
    });

  return handler;
};

export const apiRouteOperation: ApiRouteOperation = (openApiOperation) => {
  return {
    input: (input) => ({
      output: (output) => ({
        handler: (handler) => ({
          _config: {
            openApiOperation,
            input,
            output: output as OutputObject[] | undefined,
            handler: handler as NextApiHandler | undefined
          }
        })
      }),
      handler: (handler) => ({
        _config: {
          openApiOperation,
          input,
          handler: handler as NextApiHandler | undefined
        }
      })
    }),
    output: (output) => ({
      handler: (handler) => ({
        _config: {
          openApiOperation,
          output: output as OutputObject[] | undefined,
          handler: handler as NextApiHandler | undefined
        }
      })
    }),
    handler: (handler) => ({
      _config: {
        openApiOperation,
        handler: handler as NextApiHandler | undefined
      }
    })
  };
};
