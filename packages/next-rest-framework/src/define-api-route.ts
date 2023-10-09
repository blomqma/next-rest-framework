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
import { type DefineApiRouteParams } from './types/define-route';
import { type TypedNextApiRequest } from './types/request';
import { type NextApiResponse } from 'next/types';

export const defineApiRoute = ({
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
    methodHandlers: DefineApiRouteParams<
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
      req: TypedNextApiRequest<
        SchemaReturnType<BodySchema>,
        SchemaReturnType<QuerySchema>
      >,
      res: NextApiResponse
    ) => {
      try {
        const { method, body, query, headers, url: pathname } = req;

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

        if (headers['user-agent'] === NEXT_REST_FRAMEWORK_USER_AGENT) {
          const route = decodeURIComponent(pathname ?? '');

          try {
            const nextRestFrameworkPaths = getPathsFromMethodHandlers({
              config,
              methodHandlers: methodHandlers as any,
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
          res.setHeader('Allow', Object.keys(methodHandlers).join(', '));
          res.status(405).json({ message: DEFAULT_ERRORS.methodNotAllowed });
          return;
        }

        const { input, handler } = methodHandler;

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

        await handler(req, res);
      } catch (error) {
        await config.errorHandler?.({ req, error });

        if (!res.writableEnded) {
          res.status(500).json({ message: DEFAULT_ERRORS.unexpectedError });
        }
      }
    };
  };
};
