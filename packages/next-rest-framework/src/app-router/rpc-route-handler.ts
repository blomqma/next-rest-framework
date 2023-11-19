import { type NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ERRORS,
  NEXT_REST_FRAMEWORK_USER_AGENT,
  ValidMethod
} from '../constants';
import {
  validateSchema,
  logNextRestFrameworkError,
  getOasDataFromRpcOperations
} from '../shared';
import { type Client } from '../client/rpc-client';
import { type OperationDefinition } from '../shared/rpc-operation';
import { type OpenApiOperation, type OpenApiPathItem } from '../types';

export const rpcRouteHandler = <
  T extends Record<string, OperationDefinition<any, any>>
>(
  operations: T,
  options?: {
    openApiPath?: OpenApiPathItem;
    openApiOperation?: OpenApiOperation;
  }
) => {
  const handler = async (req: NextRequest) => {
    try {
      const { method, headers, nextUrl } = req;
      const { pathname } = nextUrl;

      if (method !== ValidMethod.POST) {
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

      if (
        process.env.NODE_ENV !== 'production' &&
        headers.get('user-agent') === NEXT_REST_FRAMEWORK_USER_AGENT
      ) {
        const route = decodeURIComponent(pathname ?? '');

        try {
          const nrfOasData = getOasDataFromRpcOperations({
            operations,
            route,
            options
          });

          return NextResponse.json({ nrfOasData }, { status: 200 });
        } catch (error) {
          throw Error(`OpenAPI spec generation failed for route: ${route}
${error}`);
        }
      }

      const operation =
        operations[
          (headers.get('x-rpc-operation') as keyof typeof operations) ?? ''
        ];

      if (!operation) {
        return NextResponse.json(
          { message: DEFAULT_ERRORS.operationNotAllowed },
          {
            status: 400
          }
        );
      }

      const { input, handler, middleware } = operation._meta;

      if (middleware) {
        const res = await middleware(req.clone().body);

        if (res) {
          return NextResponse.json(res, { status: 200 });
        }
      }

      if (input) {
        if (headers.get('content-type')?.split(';')[0] !== 'application/json') {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.invalidMediaType },
            { status: 415 }
          );
        }

        try {
          const reqClone = req.clone();
          const body = await reqClone.json();

          const { valid, errors } = await validateSchema({
            schema: input,
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

      if (!handler) {
        throw Error(DEFAULT_ERRORS.handlerNotFound);
      }

      const res = await handler(req.clone().body);
      return NextResponse.json(res, { status: 200 });
    } catch (error) {
      logNextRestFrameworkError(error);

      return NextResponse.json(
        { message: DEFAULT_ERRORS.unexpectedError },
        { status: 500 }
      );
    }
  };

  handler.getPaths = (route: string) =>
    getOasDataFromRpcOperations({
      operations,
      options,
      route
    });

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  handler.client = {} as Client<T>;

  return handler;
};
