import { OpenAPIV3_1 } from 'openapi-types';
import { ValidMethod } from '../constants';
import { BaseObjectSchemaType, BaseSchemaType } from './schemas';
import { Middleware } from './middleware';
import { ErrorHandler } from './error-handler';
import { MethodHandler, OutputObject } from './method-handlers';

export interface DefineEndpointsParams<
  GetBodySchema extends BaseSchemaType = BaseSchemaType,
  GetQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  GetOutput extends OutputObject = OutputObject,
  GetMiddlewareResponse = unknown,
  PutBodySchema extends BaseSchemaType = BaseSchemaType,
  PutQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  PutOutput extends OutputObject = OutputObject,
  PutMiddlewareResponse = unknown,
  PostBodySchema extends BaseSchemaType = BaseSchemaType,
  PostQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  PostOutput extends OutputObject = OutputObject,
  PostMiddlewareResponse = unknown,
  DeleteBodySchema extends BaseSchemaType = BaseSchemaType,
  DeleteQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  DeleteOutput extends OutputObject = OutputObject,
  DeleteMiddlewareResponse = unknown,
  OptionsBodySchema extends BaseSchemaType = BaseSchemaType,
  OptionsQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  OptionsOutput extends OutputObject = OutputObject,
  OptionsMiddlewareResponse = unknown,
  HeadBodySchema extends BaseSchemaType = BaseSchemaType,
  HeadQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  HeadOutput extends OutputObject = OutputObject,
  HeadMiddlewareResponse = unknown,
  PatchBodySchema extends BaseSchemaType = BaseSchemaType,
  PatchQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  PatchOutput extends OutputObject = OutputObject,
  PatchMiddlewareResponse = unknown,
  TraceBodySchema extends BaseSchemaType = BaseSchemaType,
  TraceQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  TraceOutput extends OutputObject = OutputObject,
  TraceMiddlewareResponse = unknown,
  GlobalMiddlewareResponse = unknown,
  RouteMiddlewareResponse = unknown
> {
  [ValidMethod.GET]?: MethodHandler<
    GetBodySchema,
    GetQuerySchema,
    GetOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    GetMiddlewareResponse
  >;
  [ValidMethod.PUT]?: MethodHandler<
    PutBodySchema,
    PutQuerySchema,
    PutOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PutMiddlewareResponse
  >;
  [ValidMethod.POST]?: MethodHandler<
    PostBodySchema,
    PostQuerySchema,
    PostOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PostMiddlewareResponse
  >;
  [ValidMethod.DELETE]?: MethodHandler<
    DeleteBodySchema,
    DeleteQuerySchema,
    DeleteOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    DeleteMiddlewareResponse
  >;
  [ValidMethod.OPTIONS]?: MethodHandler<
    OptionsBodySchema,
    OptionsQuerySchema,
    OptionsOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    OptionsMiddlewareResponse
  >;
  [ValidMethod.HEAD]?: MethodHandler<
    HeadBodySchema,
    HeadQuerySchema,
    HeadOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    HeadMiddlewareResponse
  >;
  [ValidMethod.PATCH]?: MethodHandler<
    PatchBodySchema,
    PatchQuerySchema,
    PatchOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PatchMiddlewareResponse
  >;
  [ValidMethod.TRACE]?: MethodHandler<
    TraceBodySchema,
    TraceQuerySchema,
    TraceOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    TraceMiddlewareResponse
  >;
  middleware?: Middleware<
    RouteMiddlewareResponse,
    { params: GlobalMiddlewareResponse }
  >;
  errorHandler?: ErrorHandler<{
    params: GlobalMiddlewareResponse & RouteMiddlewareResponse;
  }>;
  openApiSpec?: OpenAPIV3_1.PathItemObject;
}
