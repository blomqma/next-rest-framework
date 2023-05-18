import { OpenAPIV3_1 } from 'openapi-types';
import { ApiHandler } from './api-handler';
import { AnyContentTypeWithAutocompleteForMostCommonOnes } from './content-types';
import { ErrorHandler } from './error-handler';
import { Middleware } from './middleware';
import { TypedNextApiRequest } from './request';
import { TypedNextApiResponse } from './response';
import {
  BaseObjectSchemaType,
  BaseSchemaType,
  SchemaReturnType
} from './schemas';

export type BaseStatus = number;
export type BaseContentType = AnyContentTypeWithAutocompleteForMostCommonOnes;

export interface InputObject<
  BodySchema extends BaseSchemaType = BaseSchemaType,
  QuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType
> {
  contentType?: BaseContentType;
  body?: BodySchema;
  query?: QuerySchema;
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
  BodySchema extends BaseSchemaType = BaseSchemaType,
  QuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  Output extends OutputObject = OutputObject,
  GlobalMiddlewareResponse = unknown,
  RouteMiddlewareResponse = unknown,
  MethodMiddlewareResponse = unknown
> {
  tags?: string[];
  input?: InputObject<BodySchema, QuerySchema>;
  output?: Output[];
  middleware?: Middleware<
    MethodMiddlewareResponse,
    {
      params: GlobalMiddlewareResponse & RouteMiddlewareResponse;
    },
    TypedNextApiRequest<
      SchemaReturnType<BodySchema>,
      SchemaReturnType<QuerySchema>
    >,
    TypedNextApiResponse<
      Output['status'],
      Output['contentType'],
      SchemaReturnType<Output['schema']>
    >
  >;
  handler: ApiHandler<
    SchemaReturnType<BodySchema>,
    SchemaReturnType<QuerySchema>,
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
    TypedNextApiRequest<
      SchemaReturnType<BodySchema>,
      SchemaReturnType<QuerySchema>
    >,
    TypedNextApiResponse<
      Output['status'],
      Output['contentType'],
      SchemaReturnType<Output['schema']>
    >
  >;
  openApiSpecOverrides?: OpenAPIV3_1.OperationObject;
}
