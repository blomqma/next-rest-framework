import { NextApiResponse } from 'next';
import { DEFAULT_ERRORS } from './constants';
import {
  BaseContentType,
  BaseStatus,
  DefineEndpointsParams,
  NextRestFrameworkConfig,
  ResponseObject,
  TypedNextApiRequest
} from './types';
import {
  handleReservedPaths,
  isValidMethod,
  isZodSchema,
  isYupSchema,
  isYupValidationError,
  logReservedPaths,
  warnAboutReservedPath
} from './utils';

export const defineEndpoints = <GlobalMiddlewareResponse>({
  config,
  _warnAboutReservedPaths = true
}: {
  config: NextRestFrameworkConfig<GlobalMiddlewareResponse>;
  _warnAboutReservedPaths?: boolean;
}) => {
  return <
    GetBody,
    GetStatus extends BaseStatus,
    GetContentType extends BaseContentType,
    GetResponse extends ResponseObject,
    GetMiddlewareResponse,
    PutBody,
    PutStatus extends BaseStatus,
    PutContentType extends BaseContentType,
    PutResponse extends ResponseObject,
    PutMiddlewareResponse,
    PostBody,
    PostStatus extends BaseStatus,
    PostContentType extends BaseContentType,
    PostResponse extends ResponseObject,
    PostMiddlewareResponse,
    DeleteBody,
    DeleteStatus extends BaseStatus,
    DeleteContentType extends BaseContentType,
    DeleteResponse extends ResponseObject,
    DeleteMiddlewareResponse,
    OptionsBody,
    OptionsStatus extends BaseStatus,
    OptionsContentType extends BaseContentType,
    OptionsResponse extends ResponseObject,
    OptionsMiddlewareResponse,
    HeadBody,
    HeadStatus extends BaseStatus,
    HeadContentType extends BaseContentType,
    HeadResponse extends ResponseObject,
    HeadMiddlewareResponse,
    PatchBody,
    PatchStatus extends BaseStatus,
    PatchContentType extends BaseContentType,
    PatchResponse extends ResponseObject,
    PatchMiddlewareResponse,
    TraceBody,
    TraceStatus extends BaseStatus,
    TraceContentType extends BaseContentType,
    TraceResponse extends ResponseObject,
    TraceMiddlewareResponse,
    RouteMiddlewareResponse,
    Body extends GetBody &
      PutBody &
      PostBody &
      DeleteBody &
      OptionsBody &
      HeadBody &
      PatchBody &
      TraceBody,
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
      GetBody,
      GetStatus,
      GetContentType,
      GetResponse,
      GetMiddlewareResponse,
      PutBody,
      PutStatus,
      PutContentType,
      PutResponse,
      PutMiddlewareResponse,
      PostBody,
      PostStatus,
      PostContentType,
      PostResponse,
      PostMiddlewareResponse,
      DeleteBody,
      DeleteStatus,
      DeleteContentType,
      DeleteResponse,
      DeleteMiddlewareResponse,
      OptionsBody,
      OptionsStatus,
      OptionsContentType,
      OptionsResponse,
      OptionsMiddlewareResponse,
      HeadBody,
      HeadStatus,
      HeadContentType,
      HeadResponse,
      HeadMiddlewareResponse,
      PatchBody,
      PatchStatus,
      PatchContentType,
      PatchResponse,
      PatchMiddlewareResponse,
      TraceBody,
      TraceStatus,
      TraceContentType,
      TraceResponse,
      TraceMiddlewareResponse,
      GlobalMiddlewareResponse,
      RouteMiddlewareResponse
    >
  ) => {
    return async (
      req: TypedNextApiRequest<Body>,
      res: NextApiResponse
    ): Promise<
      | DefineEndpointsParams<
          GetBody,
          GetStatus,
          GetContentType,
          GetResponse,
          GetMiddlewareResponse,
          PutBody,
          PutStatus,
          PutContentType,
          PutResponse,
          PutMiddlewareResponse,
          PostBody,
          PostStatus,
          PostContentType,
          PostResponse,
          PostMiddlewareResponse,
          DeleteBody,
          DeleteStatus,
          DeleteContentType,
          DeleteResponse,
          DeleteMiddlewareResponse,
          OptionsBody,
          OptionsStatus,
          OptionsContentType,
          OptionsResponse,
          OptionsMiddlewareResponse,
          HeadBody,
          HeadStatus,
          HeadContentType,
          HeadResponse,
          HeadMiddlewareResponse,
          PatchBody,
          PatchStatus,
          PatchContentType,
          PatchResponse,
          PatchMiddlewareResponse,
          TraceBody,
          TraceStatus,
          TraceContentType,
          TraceResponse,
          TraceMiddlewareResponse,
          GlobalMiddlewareResponse,
          RouteMiddlewareResponse
        >
      | undefined
    > => {
      // The handler is called without params when generating OpenAPI spec.
      if (!req || !res) {
        return methodHandlers;
      }

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

      if (_warnAboutReservedPaths) {
        if (
          url === openApiJsonPath &&
          !global.reservedOpenApiJsonPathWarningLogged
        ) {
          warnAboutReservedPath({
            path: openApiJsonPath,
            name: 'OpenAPI JSON spec',
            configName: 'openApiJsonPath'
          });
        }

        if (
          url === openApiYamlPath &&
          !global.reservedOpenApiYamlPathWarningLogged
        ) {
          warnAboutReservedPath({
            path: openApiYamlPath,
            name: 'OpenAPI YAML spec',
            configName: 'openApiYamlPath'
          });
        }

        if (
          url === swaggerUiPath &&
          !global.reservedSwaggerUiPathWarningLogged
        ) {
          warnAboutReservedPath({
            path: swaggerUiPath,
            name: 'Swagger UI',
            configName: 'swaggerUiPath'
          });
        }
      }

      if (
        [openApiJsonPath, openApiYamlPath, swaggerUiPath].includes(url) &&
        exposeOpenApiSpec
      ) {
        const reservedPathFound = await handleReservedPaths({
          req,
          res,
          config
        });

        if (reservedPathFound) {
          return;
        }
      }

      const allowedMethods = Object.keys(methodHandlers);

      const returnMethodNotAllowed = (): void => {
        res.setHeader('Allow', allowedMethods.join(', '));
        res.status(405).json({ message: DEFAULT_ERRORS.methodNotAllowed });
      };

      const returnUnexpectedError = () => {
        res.status(500).json({ message: DEFAULT_ERRORS.unexpectedError });
      };

      if (!isValidMethod(method)) {
        returnMethodNotAllowed();
        return;
      }

      const methodHandler = methodHandlers[method];

      if (methodHandler == null) {
        returnMethodNotAllowed();
        return;
      }

      const {
        requestBody,
        handler,
        errorHandler = methodHandlers.errorHandler ?? config.errorHandler
      } = methodHandler;

      if (requestBody) {
        const { schema, contentType } = requestBody;

        if (headers['content-type'] !== contentType) {
          res
            .status(415)
            .json({ message: DEFAULT_ERRORS.unsupportedMediaType });

          return;
        }

        if (isZodSchema(schema)) {
          const data = schema.safeParse(body);

          if (!data.success) {
            res.status(400).json({ message: data.error.issues });
            return;
          }
        } else if (isYupSchema(schema)) {
          try {
            await schema.validate(body);
          } catch (e) {
            if (isYupValidationError(e)) {
              res.status(400).json({ message: e.errors });
              return;
            } else {
              returnUnexpectedError();
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
  };
};
