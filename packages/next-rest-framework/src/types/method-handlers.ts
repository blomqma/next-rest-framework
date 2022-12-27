import { OpenAPIV3_1 } from 'openapi-types';
import { ApiHandler } from './api-handler';
import { AnyContentTypeWithAutocompleteForMostCommonOnes } from './content-types';
import { ErrorHandler } from './error-handler';
import { Middleware } from './middleware';
import { TypedNextApiRequest } from './request';
import { TypedNextApiResponse } from './response';
import { BaseSchemaType, SchemaReturnType } from './schemas';
import { Modify } from './utility-types';

export type BaseStatus = number;
export type BaseContentType = AnyContentTypeWithAutocompleteForMostCommonOnes;

export interface InputObject<
  BodySchema extends BaseSchemaType = BaseSchemaType
> {
  contentType: BaseContentType;
  schema: BodySchema;
}

export interface OutputObject<
  Status = unknown,
  ContentType = unknown,
  ResponseSchema extends BaseSchemaType = BaseSchemaType
> {
  status: Status;
  schema: ResponseSchema;
  contentType: ContentType;
}

export type MethodHandler<
  BodySchema extends BaseSchemaType = BaseSchemaType,
  Status extends BaseStatus = BaseStatus,
  ContentType extends BaseContentType = BaseContentType,
  ResponseSchema extends BaseSchemaType = BaseSchemaType,
  GlobalMiddlewareResponse = unknown,
  RouteMiddlewareResponse = unknown,
  MethodMiddlewareResponse = unknown
> = Modify<
  OpenAPIV3_1.OperationObject,
  {
    input?: InputObject<BodySchema>;
    output?: Array<OutputObject<Status, ContentType, ResponseSchema>>;
    middleware?: Middleware<
      MethodMiddlewareResponse,
      {
        params: GlobalMiddlewareResponse & RouteMiddlewareResponse;
      },
      TypedNextApiRequest<SchemaReturnType<BodySchema>>,
      TypedNextApiResponse<
        Status,
        ContentType,
        SchemaReturnType<ResponseSchema>
      >
    >;
    handler: ApiHandler<
      SchemaReturnType<BodySchema>,
      Status,
      ContentType,
      SchemaReturnType<ResponseSchema>,
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
      TypedNextApiRequest<SchemaReturnType<BodySchema>>,
      TypedNextApiResponse<
        Status,
        ContentType,
        SchemaReturnType<ResponseSchema>
      >
    >;
    openApiSpec?: OpenAPIV3_1.OperationObject;
  }
>;
