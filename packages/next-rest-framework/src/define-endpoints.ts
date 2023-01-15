import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from './constants';
import {
  BaseObjectSchemaType,
  BaseSchemaType,
  DefineEndpointsParams,
  NextRestFrameworkConfig,
  OutputObject,
  SchemaReturnType,
  TypedNextApiRequest
} from './types';
import {
  isValidMethod,
  logReservedPaths,
  getPathsFromMethodHandlers,
  handleReservedPathWarnings,
  getHTMLForSwaggerUI,
  getOpenApiSpecWithPaths,
  validateSchema
} from './utils';
import yaml from 'js-yaml';
import { NextApiResponse } from 'next';

export const defineEndpoints = <GlobalMiddlewareResponse>({
  config,
  _warnAboutReservedPaths = true,
  _returnNotFoundForMissingHandler = false
}: {
  config: NextRestFrameworkConfig<GlobalMiddlewareResponse>;
  _warnAboutReservedPaths?: boolean;
  _returnNotFoundForMissingHandler?: boolean;
}) => {
  return <
    GetBodySchema extends BaseSchemaType,
    GetQuerySchema extends BaseObjectSchemaType,
    GetOutput extends OutputObject,
    GetMiddlewareResponse,
    PutBodySchema extends BaseSchemaType,
    PutQuerySchema extends BaseObjectSchemaType,
    PutOutput extends OutputObject,
    PutMiddlewareResponse,
    PostBodySchema extends BaseSchemaType,
    PostQuerySchema extends BaseObjectSchemaType,
    PostOutput extends OutputObject,
    PostMiddlewareResponse,
    DeleteBodySchema extends BaseSchemaType,
    DeleteQuerySchema extends BaseObjectSchemaType,
    DeleteOutput extends OutputObject,
    DeleteMiddlewareResponse,
    OptionsBodySchema extends BaseSchemaType,
    OptionsQuerySchema extends BaseObjectSchemaType,
    OptionsOutput extends OutputObject,
    OptionsMiddlewareResponse,
    HeadBodySchema extends BaseSchemaType,
    HeadQuerySchema extends BaseObjectSchemaType,
    HeadOutput extends OutputObject,
    HeadMiddlewareResponse,
    PatchBodySchema extends BaseSchemaType,
    PatchQuerySchema extends BaseObjectSchemaType,
    PatchOutput extends OutputObject,
    PatchMiddlewareResponse,
    TraceBodySchema extends BaseSchemaType,
    TraceQuerySchema extends BaseObjectSchemaType,
    TraceOutput extends OutputObject,
    TraceMiddlewareResponse,
    RouteMiddlewareResponse,
    BodySchema extends GetBodySchema &
      PutBodySchema &
      PostBodySchema &
      DeleteBodySchema &
      OptionsBodySchema &
      HeadBodySchema &
      PatchBodySchema &
      TraceBodySchema,
    QuerySchema extends GetQuerySchema &
      PutQuerySchema &
      PostQuerySchema &
      DeleteQuerySchema &
      OptionsQuerySchema &
      HeadQuerySchema &
      PatchQuerySchema &
      TraceQuerySchema,
    MiddlewareResponse extends GetMiddlewareResponse &
      PutMiddlewareResponse &
      PostMiddlewareResponse &
      DeleteMiddlewareResponse &
      OptionsMiddlewareResponse &
      HeadMiddlewareResponse &
      PatchMiddlewareResponse &
      TraceMiddlewareResponse
  >(
    methodHandlers: DefineEndpointsParams<
      GetBodySchema,
      GetQuerySchema,
      GetOutput,
      GetMiddlewareResponse,
      PutBodySchema,
      PutQuerySchema,
      PutOutput,
      PutMiddlewareResponse,
      PostBodySchema,
      PostQuerySchema,
      PostOutput,
      PostMiddlewareResponse,
      DeleteBodySchema,
      DeleteQuerySchema,
      DeleteOutput,
      DeleteMiddlewareResponse,
      OptionsBodySchema,
      OptionsQuerySchema,
      OptionsOutput,
      OptionsMiddlewareResponse,
      HeadBodySchema,
      HeadQuerySchema,
      HeadOutput,
      HeadMiddlewareResponse,
      PatchBodySchema,
      PatchQuerySchema,
      PatchOutput,
      PatchMiddlewareResponse,
      TraceBodySchema,
      TraceQuerySchema,
      TraceOutput,
      TraceMiddlewareResponse,
      GlobalMiddlewareResponse,
      RouteMiddlewareResponse
    > = {}
  ) => {
    return async (
      req: TypedNextApiRequest<
        SchemaReturnType<BodySchema>,
        SchemaReturnType<QuerySchema>
      >,
      res: NextApiResponse
    ): Promise<
      | DefineEndpointsParams<
          GetBodySchema,
          GetQuerySchema,
          GetOutput,
          GetMiddlewareResponse,
          PutBodySchema,
          PutQuerySchema,
          PutOutput,
          PutMiddlewareResponse,
          PostBodySchema,
          PostQuerySchema,
          PostOutput,
          PostMiddlewareResponse,
          DeleteBodySchema,
          DeleteQuerySchema,
          DeleteOutput,
          DeleteMiddlewareResponse,
          OptionsBodySchema,
          OptionsQuerySchema,
          OptionsOutput,
          OptionsMiddlewareResponse,
          HeadBodySchema,
          HeadQuerySchema,
          HeadOutput,
          HeadMiddlewareResponse,
          PatchBodySchema,
          PatchQuerySchema,
          PatchOutput,
          PatchMiddlewareResponse,
          TraceBodySchema,
          TraceQuerySchema,
          TraceOutput,
          TraceMiddlewareResponse,
          GlobalMiddlewareResponse,
          RouteMiddlewareResponse
        >
      | undefined
    > => {
      const returnUnexpectedError = () => {
        res.status(500).json({ message: DEFAULT_ERRORS.unexpectedError });
      };

      const handleRequest = async (): Promise<
        | DefineEndpointsParams<
            GetBodySchema,
            GetQuerySchema,
            GetOutput,
            GetMiddlewareResponse,
            PutBodySchema,
            PutQuerySchema,
            PutOutput,
            PutMiddlewareResponse,
            PostBodySchema,
            PostQuerySchema,
            PostOutput,
            PostMiddlewareResponse,
            DeleteBodySchema,
            DeleteQuerySchema,
            DeleteOutput,
            DeleteMiddlewareResponse,
            OptionsBodySchema,
            OptionsQuerySchema,
            OptionsOutput,
            OptionsMiddlewareResponse,
            HeadBodySchema,
            HeadQuerySchema,
            HeadOutput,
            HeadMiddlewareResponse,
            PatchBodySchema,
            PatchQuerySchema,
            PatchOutput,
            PatchMiddlewareResponse,
            TraceBodySchema,
            TraceQuerySchema,
            TraceOutput,
            TraceMiddlewareResponse,
            GlobalMiddlewareResponse,
            RouteMiddlewareResponse
          >
        | undefined
      > => {
        const { method, body, query, headers, url } = req;

        const {
          openApiJsonPath,
          openApiYamlPath,
          swaggerUiPath,
          exposeOpenApiSpec,
          suppressInfo
        } = config;

        if (!suppressInfo && !global.reservedPathsLogged) {
          logReservedPaths({ config, headers });
        }

        if (
          [openApiJsonPath, openApiYamlPath, swaggerUiPath].includes(url) &&
          exposeOpenApiSpec
        ) {
          if (_warnAboutReservedPaths) {
            handleReservedPathWarnings({ url, config });
          }

          const spec = await getOpenApiSpecWithPaths({ req, res, config });

          if (url === openApiJsonPath) {
            res.status(200).json(spec);
            return;
          }

          if (url === openApiYamlPath) {
            res.setHeader('Content-Type', 'text/plain');
            res.status(200).send(yaml.dump(spec));
            return;
          }

          if (url === swaggerUiPath) {
            const html = getHTMLForSwaggerUI({ headers, config });
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(html);
            return;
          }
        }

        const allowedMethods = Object.keys(methodHandlers);

        const returnMethodNotAllowed = (): void => {
          res.setHeader('Allow', allowedMethods.join(', '));
          res.status(405).json({ message: DEFAULT_ERRORS.methodNotAllowed });
        };

        if (headers['user-agent'] === NEXT_REST_FRAMEWORK_USER_AGENT) {
          const route = url ?? '';

          try {
            const paths = getPathsFromMethodHandlers({
              config,
              methodHandlers: methodHandlers as DefineEndpointsParams,
              route
            });

            res.status(200).json(paths);
            return;
          } catch (error) {
            throw Error(`OpenAPI spec generation failed for route: ${route}
${error}`);
          }
        }

        if (!isValidMethod(method)) {
          returnMethodNotAllowed();
          return;
        }

        const methodHandler = methodHandlers[method];

        if (!methodHandler && _returnNotFoundForMissingHandler) {
          res.status(404).json({ message: DEFAULT_ERRORS.notFound });
          return;
        } else if (!methodHandler) {
          returnMethodNotAllowed();
          return;
        }

        const {
          input,
          handler,
          errorHandler = methodHandlers.errorHandler ?? config.errorHandler
        } = methodHandler;

        if (input) {
          const { body: bodySchema, query: querySchema, contentType } = input;

          if (headers['content-type'] !== contentType) {
            res.status(415).json({ message: DEFAULT_ERRORS.invalidMediaType });
            return;
          }

          if (bodySchema) {
            const validateBody = await validateSchema?.({
              schema: bodySchema,
              obj: body
            });

            if (validateBody) {
              const { valid, errors } = validateBody;

              if (!valid) {
                res
                  .status(400)
                  .json({ message: `Invalid request body: ${errors}` });
                return;
              }
            }
          }

          if (querySchema) {
            const validateQuery = await validateSchema?.({
              schema: querySchema,
              obj: query
            });

            if (validateQuery) {
              const { valid, errors } = validateQuery;

              if (!valid) {
                res
                  .status(400)
                  .json({ message: `Invalid query parameters: ${errors}` });
                return;
              }
            }
          }
        }

        const globalMiddlewareParams = (await config.middleware?.({
          req,
          res
        })) as Awaited<GlobalMiddlewareResponse>;

        const routeMiddlewareParams = (await methodHandlers.middleware?.({
          req,
          res,
          params: globalMiddlewareParams
        })) as Awaited<RouteMiddlewareResponse>;

        const methodMiddlewareParams = (await methodHandler.middleware?.({
          req,
          res,
          params: {
            ...globalMiddlewareParams,
            ...routeMiddlewareParams
          }
        })) as Awaited<MiddlewareResponse>;

        const params = {
          ...globalMiddlewareParams,
          ...routeMiddlewareParams,
          ...methodMiddlewareParams
        };

        try {
          await handler({
            req,
            res,
            params
          });
        } catch (error) {
          await errorHandler?.({
            req,
            res,
            error,
            params
          });
          returnUnexpectedError();
        }
      };

      try {
        return await handleRequest();
      } catch (error) {
        await config.errorHandler?.({ req, res, error });
        returnUnexpectedError();
      }
    };
  };
};
