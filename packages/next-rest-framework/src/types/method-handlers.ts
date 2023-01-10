import { OpenAPIV3_1 } from 'openapi-types';
import { ApiHandler } from './api-handler';
import { AnyContentTypeWithAutocompleteForMostCommonOnes } from './content-types';
import { ErrorHandler } from './error-handler';
import { Middleware } from './middleware';
import { TypedNextApiRequest } from './request';
import { TypedNextApiResponse } from './response';
import { BaseSchemaType, SchemaReturnType } from './schemas';

export type BaseStatus = number;
export type BaseContentType = AnyContentTypeWithAutocompleteForMostCommonOnes;

export interface InputObject<
  InputSchema extends BaseSchemaType = BaseSchemaType
> {
  contentType: BaseContentType;
  schema: InputSchema;
}

export interface OutputObject<
  Status extends BaseStatus = BaseStatus,
  ContentType extends BaseContentType = BaseContentType,
  ResponseSchema extends BaseSchemaType = BaseSchemaType
> {
  status: Status;
  schema: ResponseSchema;
  contentType: ContentType;
}

export interface MethodHandler<
  InputSchema extends BaseSchemaType = BaseSchemaType,
  Output extends OutputObject = OutputObject,
  GlobalMiddlewareResponse = unknown,
  RouteMiddlewareResponse = unknown,
  MethodMiddlewareResponse = unknown
> {
  input?: InputObject<InputSchema>;
  output?: Output[];
  middleware?: Middleware<
    MethodMiddlewareResponse,
    {
      params: GlobalMiddlewareResponse & RouteMiddlewareResponse;
    },
    TypedNextApiRequest<SchemaReturnType<InputSchema>>,
    TypedNextApiResponse<
      Output['status'],
      Output['contentType'],
      SchemaReturnType<Output['schema']>
    >
  >;
  handler: ApiHandler<
    SchemaReturnType<InputSchema>,
    Output['status'],
    Output['contentType'],
    SchemaReturnType<Output['schema']>,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    MethodMiddlewareResponse
  >;
  errorHandler?: ErrorHandler<
    {
      params: GlobalMiddlewareResponse &
        RouteMiddlewareResponse &
        MethodMiddlewareResponse;
    },
    TypedNextApiRequest<SchemaReturnType<InputSchema>>,
    TypedNextApiResponse<
      Output['status'],
      Output['contentType'],
      SchemaReturnType<Output['schema']>
    >
  >;
  openApiSpec?: OpenAPIV3_1.OperationObject;
}
