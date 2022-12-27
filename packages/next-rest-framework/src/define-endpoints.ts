import { NextApiResponse } from 'next';
import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from './constants';
import {
  BaseContentType,
  BaseSchemaType,
  BaseStatus,
  DefineEndpointsParams,
  NextRestFrameworkConfig,
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
    GetStatus extends BaseStatus,
    GetContentType extends BaseContentType,
    GetResponseSchema extends BaseSchemaType,
    GetMiddlewareResponse,
    PutBodySchema extends BaseSchemaType,
    PutStatus extends BaseStatus,
    PutContentType extends BaseContentType,
    PutResponseSchema extends BaseSchemaType,
    PutMiddlewareResponse,
    PostBodySchema extends BaseSchemaType,
    PostStatus extends BaseStatus,
    PostContentType extends BaseContentType,
    PostResponseSchema extends BaseSchemaType,
    PostMiddlewareResponse,
    DeleteBodySchema extends BaseSchemaType,
    DeleteStatus extends BaseStatus,
    DeleteContentType extends BaseContentType,
    DeleteResponseSchema extends BaseSchemaType,
    DeleteMiddlewareResponse,
    OptionsBodySchema extends BaseSchemaType,
    OptionsStatus extends BaseStatus,
    OptionsContentType extends BaseContentType,
    OptionsResponseSchema extends BaseSchemaType,
    OptionsMiddlewareResponse,
    HeadBodySchema extends BaseSchemaType,
    HeadStatus extends BaseStatus,
    HeadContentType extends BaseContentType,
    HeadResponseSchema extends BaseSchemaType,
    HeadMiddlewareResponse,
    PatchBodySchema extends BaseSchemaType,
    PatchStatus extends BaseStatus,
    PatchContentType extends BaseContentType,
    PatchResponseSchema extends BaseSchemaType,
    PatchMiddlewareResponse,
    TraceBodySchema extends BaseSchemaType,
    TraceStatus extends BaseStatus,
    TraceContentType extends BaseContentType,
    TraceResponseSchema extends BaseSchemaType,
    TraceMiddlewareResponse,
    RouteMiddlewareResponse,
    SchemaType extends GetBodySchema &
      PutBodySchema &
      PostBodySchema &
      DeleteBodySchema &
      OptionsBodySchema &
      HeadBodySchema &
      PatchBodySchema &
      TraceBodySchema,
    MethodMiddlewareResponse extends GetMiddlewareResponse &
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
      GetStatus,
      GetContentType,
      GetResponseSchema,
      GetMiddlewareResponse,
      PutBodySchema,
      PutStatus,
      PutContentType,
      PutResponseSchema,
      PutMiddlewareResponse,
      PostBodySchema,
      PostStatus,
      PostContentType,
      PostResponseSchema,
      PostMiddlewareResponse,
      DeleteBodySchema,
      DeleteStatus,
      DeleteContentType,
      DeleteResponseSchema,
      DeleteMiddlewareResponse,
      OptionsBodySchema,
      OptionsStatus,
      OptionsContentType,
      OptionsResponseSchema,
      OptionsMiddlewareResponse,
      HeadBodySchema,
      HeadStatus,
      HeadContentType,
      HeadResponseSchema,
      HeadMiddlewareResponse,
      PatchBodySchema,
      PatchStatus,
      PatchContentType,
      PatchResponseSchema,
      PatchMiddlewareResponse,
      TraceBodySchema,
      TraceStatus,
      TraceContentType,
      TraceResponseSchema,
      TraceMiddlewareResponse,
      GlobalMiddlewareResponse,
      RouteMiddlewareResponse
    > = {}
  ) => {
    return async (
      req: TypedNextApiRequest<SchemaReturnType<SchemaType>>,
      res: NextApiResponse
    ): Promise<
      | DefineEndpointsParams<
          GetBodySchema,
          GetStatus,
          GetContentType,
          GetResponseSchema,
          GetMiddlewareResponse,
          PutBodySchema,
          PutStatus,
          PutContentType,
          PutResponseSchema,
          PutMiddlewareResponse,
          PostBodySchema,
          PostStatus,
          PostContentType,
          PostResponseSchema,
          PostMiddlewareResponse,
          DeleteBodySchema,
          DeleteStatus,
          DeleteContentType,
          DeleteResponseSchema,
          DeleteMiddlewareResponse,
          OptionsBodySchema,
          OptionsStatus,
          OptionsContentType,
          OptionsResponseSchema,
          OptionsMiddlewareResponse,
          HeadBodySchema,
          HeadStatus,
          HeadContentType,
          HeadResponseSchema,
          HeadMiddlewareResponse,
          PatchBodySchema,
          PatchStatus,
          PatchContentType,
          PatchResponseSchema,
          PatchMiddlewareResponse,
          TraceBodySchema,
          TraceStatus,
          TraceContentType,
          TraceResponseSchema,
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
            GetStatus,
            GetContentType,
            GetResponseSchema,
            GetMiddlewareResponse,
            PutBodySchema,
            PutStatus,
            PutContentType,
            PutResponseSchema,
            PutMiddlewareResponse,
            PostBodySchema,
            PostStatus,
            PostContentType,
            PostResponseSchema,
            PostMiddlewareResponse,
            DeleteBodySchema,
            DeleteStatus,
            DeleteContentType,
            DeleteResponseSchema,
            DeleteMiddlewareResponse,
            OptionsBodySchema,
            OptionsStatus,
            OptionsContentType,
            OptionsResponseSchema,
            OptionsMiddlewareResponse,
            HeadBodySchema,
            HeadStatus,
            HeadContentType,
            HeadResponseSchema,
            HeadMiddlewareResponse,
            PatchBodySchema,
            PatchStatus,
            PatchContentType,
            PatchResponseSchema,
            PatchMiddlewareResponse,
            TraceBodySchema,
            TraceStatus,
            TraceContentType,
            TraceResponseSchema,
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
            const html = getHTMLForSwaggerUI({ headers });
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
        })) as Awaited<MethodMiddlewareResponse>;

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
          await errorHandler?.({ req, res, error, params });
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
