import { type OpenAPIV3_1 } from 'openapi-types';
import { type ApiRouteHandler, type RouteHandler } from './route-handler';
import { type AnyContentTypeWithAutocompleteForMostCommonOnes } from './content-types';
import {
  type BaseObjectSchemaType,
  type BaseSchemaType,
  type SchemaReturnType
} from './schemas';
import { type Modify } from './utility-types';

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
  ResponseSchema extends BaseSchemaType = BaseSchemaType,
  Status extends BaseStatus = BaseStatus,
  ContentType extends BaseContentType = BaseContentType
> {
  schema: ResponseSchema;
  status: Status;
  contentType: ContentType;
}

export interface MethodHandler<
  BodySchema extends BaseSchemaType = BaseSchemaType,
  QuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  Output extends OutputObject = OutputObject
> {
  tags?: string[];
  input?: InputObject<BodySchema, QuerySchema>;
  output?: Output[];
  handler: RouteHandler<
    SchemaReturnType<BodySchema>,
    SchemaReturnType<QuerySchema>,
    SchemaReturnType<Output['schema']>
  >;
  openApiSpecOverrides?: OpenAPIV3_1.OperationObject;
}

export type ApiRouteMethodHandler<
  BodySchema extends BaseSchemaType = BaseSchemaType,
  QuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  Output extends OutputObject = OutputObject
> = Modify<
  MethodHandler<BodySchema, QuerySchema, Output>,
  {
    handler: ApiRouteHandler<
      SchemaReturnType<BodySchema>,
      SchemaReturnType<QuerySchema>,
      SchemaReturnType<Output['schema']>
    >;
  }
>;
