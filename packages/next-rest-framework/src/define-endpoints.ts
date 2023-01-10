import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from './constants';
import {
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
  validateRequestBody
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
    GetInputSchema extends BaseSchemaType,
    GetOutput extends OutputObject,
    GetMiddlewareResponse,
    PutInputSchema extends BaseSchemaType,
    PutOutput extends OutputObject,
    PutMiddlewareResponse,
    PostInputSchema extends BaseSchemaType,
    PostOutput extends OutputObject,
    PostMiddlewareResponse,
    DeleteInputSchema extends BaseSchemaType,
    DeleteOutput extends OutputObject,
    DeleteMiddlewareResponse,
    OptionsInputSchema extends BaseSchemaType,
    OptionsOutput extends OutputObject,
    OptionsMiddlewareResponse,
    HeadInputSchema extends BaseSchemaType,
    HeadOutput extends OutputObject,
    HeadMiddlewareResponse,
    PatchInputSchema extends BaseSchemaType,
    PatchOutput extends OutputObject,
    PatchMiddlewareResponse,
    TraceInputSchema extends BaseSchemaType,
    TraceOutput extends OutputObject,
    TraceMiddlewareResponse,
    RouteMiddlewareResponse,
    InputSchema extends GetInputSchema &
      PutInputSchema &
      PostInputSchema &
      DeleteInputSchema &
      OptionsInputSchema &
      HeadInputSchema &
      PatchInputSchema &
      TraceInputSchema,
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
      GetInputSchema,
      GetOutput,
      GetMiddlewareResponse,
      PutInputSchema,
      PutOutput,
      PutMiddlewareResponse,
      PostInputSchema,
      PostOutput,
      PostMiddlewareResponse,
      DeleteInputSchema,
      DeleteOutput,
      DeleteMiddlewareResponse,
      OptionsInputSchema,
      OptionsOutput,
      OptionsMiddlewareResponse,
      HeadInputSchema,
      HeadOutput,
      HeadMiddlewareResponse,
      PatchInputSchema,
      PatchOutput,
      PatchMiddlewareResponse,
      TraceInputSchema,
      TraceOutput,
      TraceMiddlewareResponse,
      GlobalMiddlewareResponse,
      RouteMiddlewareResponse
    > = {}
  ) => {
    return async (
      req: TypedNextApiRequest<SchemaReturnType<InputSchema>>,
      res: NextApiResponse
    ): Promise<
      | DefineEndpointsParams<
          GetInputSchema,
          GetOutput,
          GetMiddlewareResponse,
          PutInputSchema,
          PutOutput,
          PutMiddlewareResponse,
          PostInputSchema,
          PostOutput,
          PostMiddlewareResponse,
          DeleteInputSchema,
          DeleteOutput,
          DeleteMiddlewareResponse,
          OptionsInputSchema,
          OptionsOutput,
          OptionsMiddlewareResponse,
          HeadInputSchema,
          HeadOutput,
          HeadMiddlewareResponse,
          PatchInputSchema,
          PatchOutput,
          PatchMiddlewareResponse,
          TraceInputSchema,
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
            GetInputSchema,
            GetOutput,
            GetMiddlewareResponse,
            PutInputSchema,
            PutOutput,
            PutMiddlewareResponse,
            PostInputSchema,
            PostOutput,
            PostMiddlewareResponse,
            DeleteInputSchema,
            DeleteOutput,
            DeleteMiddlewareResponse,
            OptionsInputSchema,
            OptionsOutput,
            OptionsMiddlewareResponse,
            HeadInputSchema,
            HeadOutput,
            HeadMiddlewareResponse,
            PatchInputSchema,
            PatchOutput,
            PatchMiddlewareResponse,
            TraceInputSchema,
            TraceOutput,
            TraceMiddlewareResponse,
            GlobalMiddlewareResponse,
            RouteMiddlewareResponse
          >
        | undefined
      > => {
        const { method, body, headers, url } = req;

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
          const { schema, contentType } = input;

          if (headers['content-type'] !== contentType) {
            res.status(415).json({ message: DEFAULT_ERRORS.invalidMediaType });
            return;
          }

          const validate = await validateRequestBody?.({
            schema,
            body
          });

          if (validate) {
            const { valid, errors } = validate;

            if (!valid) {
              res.status(400).json({ message: errors });
              return;
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
