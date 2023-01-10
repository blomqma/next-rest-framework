import { OpenAPIV3_1 } from 'openapi-types';
import { ValidMethod } from '../constants';
import { BaseSchemaType } from './schemas';
import { Middleware } from './middleware';
import { ErrorHandler } from './error-handler';
import { MethodHandler, OutputObject } from './method-handlers';

export interface DefineEndpointsParams<
  GetInputSchema extends BaseSchemaType = BaseSchemaType,
  GetOutput extends OutputObject = OutputObject,
  GetMiddlewareResponse = unknown,
  PutInputSchema extends BaseSchemaType = BaseSchemaType,
  PutOutput extends OutputObject = OutputObject,
  PutMiddlewareResponse = unknown,
  PostInputSchema extends BaseSchemaType = BaseSchemaType,
  PostOutput extends OutputObject = OutputObject,
  PostMiddlewareResponse = unknown,
  DeleteInputSchema extends BaseSchemaType = BaseSchemaType,
  DeleteOutput extends OutputObject = OutputObject,
  DeleteMiddlewareResponse = unknown,
  OptionsInputSchema extends BaseSchemaType = BaseSchemaType,
  OptionsOutput extends OutputObject = OutputObject,
  OptionsMiddlewareResponse = unknown,
  HeadInputSchema extends BaseSchemaType = BaseSchemaType,
  HeadOutput extends OutputObject = OutputObject,
  HeadMiddlewareResponse = unknown,
  PatchInputSchema extends BaseSchemaType = BaseSchemaType,
  PatchOutput extends OutputObject = OutputObject,
  PatchMiddlewareResponse = unknown,
  TraceInputSchema extends BaseSchemaType = BaseSchemaType,
  TraceOutput extends OutputObject = OutputObject,
  TraceMiddlewareResponse = unknown,
  GlobalMiddlewareResponse = unknown,
  RouteMiddlewareResponse = unknown
> {
  [ValidMethod.GET]?: MethodHandler<
    GetInputSchema,
    GetOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    GetMiddlewareResponse
  >;
  [ValidMethod.PUT]?: MethodHandler<
    PutInputSchema,
    PutOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PutMiddlewareResponse
  >;
  [ValidMethod.POST]?: MethodHandler<
    PostInputSchema,
    PostOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PostMiddlewareResponse
  >;
  [ValidMethod.DELETE]?: MethodHandler<
    DeleteInputSchema,
    DeleteOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    DeleteMiddlewareResponse
  >;
  [ValidMethod.OPTIONS]?: MethodHandler<
    OptionsInputSchema,
    OptionsOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    OptionsMiddlewareResponse
  >;
  [ValidMethod.HEAD]?: MethodHandler<
    HeadInputSchema,
    HeadOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    HeadMiddlewareResponse
  >;
  [ValidMethod.PATCH]?: MethodHandler<
    PatchInputSchema,
    PatchOutput,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PatchMiddlewareResponse
  >;
  [ValidMethod.TRACE]?: MethodHandler<
    TraceInputSchema,
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
