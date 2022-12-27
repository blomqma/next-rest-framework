import { OpenAPIV3_1 } from 'openapi-types';
import { ValidMethod } from '../constants';
import { BaseSchemaType } from './schemas';
import { Middleware } from './middleware';
import { ErrorHandler } from './error-handler';
import { BaseContentType, BaseStatus, MethodHandler } from './method-handlers';

export interface DefineEndpointsParams<
  GetBodySchema extends BaseSchemaType = BaseSchemaType,
  GetStatus extends BaseStatus = BaseStatus,
  GetContentType extends BaseContentType = BaseContentType,
  GetResponseSchema extends BaseSchemaType = BaseSchemaType,
  GetMiddlewareResponse = unknown,
  PutBodySchema extends BaseSchemaType = BaseSchemaType,
  PutStatus extends BaseStatus = BaseStatus,
  PutContentType extends BaseContentType = BaseContentType,
  PutResponseSchema extends BaseSchemaType = BaseSchemaType,
  PutMiddlewareResponse = unknown,
  PostBodySchema extends BaseSchemaType = BaseSchemaType,
  PostStatus extends BaseStatus = BaseStatus,
  PostContentType extends BaseContentType = BaseContentType,
  PostResponseSchema extends BaseSchemaType = BaseSchemaType,
  PostMiddlewareResponse = unknown,
  DeleteBodySchema extends BaseSchemaType = BaseSchemaType,
  DeleteStatus extends BaseStatus = BaseStatus,
  DeleteContentType extends BaseContentType = BaseContentType,
  DeleteResponseSchema extends BaseSchemaType = BaseSchemaType,
  DeleteMiddlewareResponse = unknown,
  OptionsBodySchema extends BaseSchemaType = BaseSchemaType,
  OptionsStatus extends BaseStatus = BaseStatus,
  OptionsContentType extends BaseContentType = BaseContentType,
  OptionsResponseSchema extends BaseSchemaType = BaseSchemaType,
  OptionsMiddlewareResponse = unknown,
  HeadBodySchema extends BaseSchemaType = BaseSchemaType,
  HeadStatus extends BaseStatus = BaseStatus,
  HeadContentType extends BaseContentType = BaseContentType,
  HeadResponseSchema extends BaseSchemaType = BaseSchemaType,
  HeadMiddlewareResponse = unknown,
  PatchBodySchema extends BaseSchemaType = BaseSchemaType,
  PatchStatus extends BaseStatus = BaseStatus,
  PatchContentType extends BaseContentType = BaseContentType,
  PatchResponseSchema extends BaseSchemaType = BaseSchemaType,
  PatchMiddlewareResponse = unknown,
  TraceBodySchema extends BaseSchemaType = BaseSchemaType,
  TraceStatus extends BaseStatus = BaseStatus,
  TraceContentType extends BaseContentType = BaseContentType,
  TraceResponseSchema extends BaseSchemaType = BaseSchemaType,
  TraceMiddlewareResponse = unknown,
  GlobalMiddlewareResponse = unknown,
  RouteMiddlewareResponse = unknown
> {
  [ValidMethod.GET]?: MethodHandler<
    GetBodySchema,
    GetStatus,
    GetContentType,
    GetResponseSchema,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    GetMiddlewareResponse
  >;
  [ValidMethod.PUT]?: MethodHandler<
    PutBodySchema,
    PutStatus,
    PutContentType,
    PutResponseSchema,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PutMiddlewareResponse
  >;
  [ValidMethod.POST]?: MethodHandler<
    PostBodySchema,
    PostStatus,
    PostContentType,
    PostResponseSchema,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PostMiddlewareResponse
  >;
  [ValidMethod.DELETE]?: MethodHandler<
    DeleteBodySchema,
    DeleteStatus,
    DeleteContentType,
    DeleteResponseSchema,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    DeleteMiddlewareResponse
  >;
  [ValidMethod.OPTIONS]?: MethodHandler<
    OptionsBodySchema,
    OptionsStatus,
    OptionsContentType,
    OptionsResponseSchema,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    OptionsMiddlewareResponse
  >;
  [ValidMethod.HEAD]?: MethodHandler<
    HeadBodySchema,
    HeadStatus,
    HeadContentType,
    HeadResponseSchema,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    HeadMiddlewareResponse
  >;
  [ValidMethod.PATCH]?: MethodHandler<
    PatchBodySchema,
    PatchStatus,
    PatchContentType,
    PatchResponseSchema,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PatchMiddlewareResponse
  >;
  [ValidMethod.TRACE]?: MethodHandler<
    TraceBodySchema,
    TraceStatus,
    TraceContentType,
    TraceResponseSchema,
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
