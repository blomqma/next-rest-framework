import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from '../constants';
import { type ApiRouteParams } from '../types';
import {
  getPathsFromMethodHandlers,
  isValidMethod,
  validateSchema,
  logNextRestFrameworkError
} from '../utils';
import { type NextApiRequest, type NextApiResponse } from 'next/types';

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

      if (
        process.env.NODE_ENV !== 'production' &&
        headers['user-agent'] === NEXT_REST_FRAMEWORK_USER_AGENT
      ) {
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

      const { input, handler, middleware } = methodHandler._config;

      if (middleware) {
        await middleware(req, res);

        if (res.writableEnded) {
          return;
        }
      }

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
