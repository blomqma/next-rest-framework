import { NextResponse } from 'next/server';
import {
  DEFAULT_ERRORS,
  NEXT_REST_FRAMEWORK_USER_AGENT,
  ValidMethod
} from './constants';
import {
  type BaseObjectSchemaType,
  type BaseSchemaType,
  type NextRestFrameworkConfig,
  type OutputObject,
  type SchemaReturnType
} from './types';
import {
  getPathsFromMethodHandlers,
  handleReservedPathWarnings,
  validateSchema
} from './utils';
import { type DefineRouteParams } from './types/define-route';
import { type TypedNextRequest } from './types/request';

export const defineRoute = ({
  config
}: {
  config: NextRestFrameworkConfig;
}) => {
  return <
    GetBodySchema extends BaseSchemaType,
    GetQuerySchema extends BaseObjectSchemaType,
    GetOutput extends OutputObject,
    PutBodySchema extends BaseSchemaType,
    PutQuerySchema extends BaseObjectSchemaType,
    PutOutput extends OutputObject,
    PostBodySchema extends BaseSchemaType,
    PostQuerySchema extends BaseObjectSchemaType,
    PostOutput extends OutputObject,
    DeleteBodySchema extends BaseSchemaType,
    DeleteQuerySchema extends BaseObjectSchemaType,
    DeleteOutput extends OutputObject,
    OptionsBodySchema extends BaseSchemaType,
    OptionsQuerySchema extends BaseObjectSchemaType,
    OptionsOutput extends OutputObject,
    HeadBodySchema extends BaseSchemaType,
    HeadQuerySchema extends BaseObjectSchemaType,
    HeadOutput extends OutputObject,
    PatchBodySchema extends BaseSchemaType,
    PatchQuerySchema extends BaseObjectSchemaType,
    PatchOutput extends OutputObject,
    BodySchema extends GetBodySchema &
      PutBodySchema &
      PostBodySchema &
      DeleteBodySchema &
      OptionsBodySchema &
      HeadBodySchema &
      PatchBodySchema,
    QuerySchema extends GetQuerySchema &
      PutQuerySchema &
      PostQuerySchema &
      DeleteQuerySchema &
      OptionsQuerySchema &
      HeadQuerySchema &
      PatchQuerySchema
  >(
    methodHandlers: DefineRouteParams<
      GetBodySchema,
      GetQuerySchema,
      GetOutput,
      PutBodySchema,
      PutQuerySchema,
      PutOutput,
      PostBodySchema,
      PostQuerySchema,
      PostOutput,
      DeleteBodySchema,
      DeleteQuerySchema,
      DeleteOutput,
      OptionsBodySchema,
      OptionsQuerySchema,
      OptionsOutput,
      HeadBodySchema,
      HeadQuerySchema,
      HeadOutput,
      PatchBodySchema,
      PatchQuerySchema,
      PatchOutput
    > = {}
  ) => {
    return async (
      req: TypedNextRequest<
        SchemaReturnType<BodySchema>,
        SchemaReturnType<QuerySchema>
      >,
      context: { params: Record<string, unknown> }
    ) => {
      try {
        const { method, headers, nextUrl } = req;
        const { pathname } = nextUrl;

        const {
          openApiJsonPath,
          openApiYamlPath,
          swaggerUiPath,
          exposeOpenApiSpec
        } = config;

        if (
          [openApiJsonPath, openApiYamlPath, swaggerUiPath].includes(
            pathname
          ) &&
          exposeOpenApiSpec &&
          method === ValidMethod.GET
        ) {
          handleReservedPathWarnings({ pathname, config });
        }

        if (headers.get('user-agent') === NEXT_REST_FRAMEWORK_USER_AGENT) {
          const route = decodeURIComponent(pathname ?? '');

          try {
            const nextRestFrameworkPaths = getPathsFromMethodHandlers({
              config,
              methodHandlers,
              route
            });

            return NextResponse.json(
              { nextRestFrameworkPaths },
              { status: 200 }
            );
          } catch (error) {
            throw Error(`OpenAPI spec generation failed for route: ${route}
${error}`);
          }
        }

        const methodHandler = methodHandlers[method];

        if (!methodHandler) {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.methodNotAllowed },
            {
              status: 405,
              headers: {
                Allow: Object.keys(methodHandlers).join(', ')
              }
            }
          );
        }

        const { input, handler } = methodHandler;

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

        return await handler(req, context);
      } catch (error) {
        const res = await config.errorHandler?.({ req, error });

        if (res) {
          return res;
        } else {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.unexpectedError },
            { status: 500 }
          );
        }
      }
    };
  };
};
