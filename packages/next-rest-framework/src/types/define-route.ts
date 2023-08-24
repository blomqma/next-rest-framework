import { type OpenAPIV3_1 } from 'openapi-types';
import { type ValidMethod } from '../constants';
import { type BaseObjectSchemaType, type BaseSchemaType } from './schemas';
import {
  type ApiRouteMethodHandler,
  type MethodHandler,
  type OutputObject
} from './method-handlers';

export interface DefineRouteParams<
  GetBodySchema extends BaseSchemaType = BaseSchemaType,
  GetQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  GetOutput extends OutputObject = OutputObject,
  PutBodySchema extends BaseSchemaType = BaseSchemaType,
  PutQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  PutOutput extends OutputObject = OutputObject,
  PostBodySchema extends BaseSchemaType = BaseSchemaType,
  PostQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  PostOutput extends OutputObject = OutputObject,
  DeleteBodySchema extends BaseSchemaType = BaseSchemaType,
  DeleteQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  DeleteOutput extends OutputObject = OutputObject,
  OptionsBodySchema extends BaseSchemaType = BaseSchemaType,
  OptionsQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  OptionsOutput extends OutputObject = OutputObject,
  HeadBodySchema extends BaseSchemaType = BaseSchemaType,
  HeadQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  HeadOutput extends OutputObject = OutputObject,
  PatchBodySchema extends BaseSchemaType = BaseSchemaType,
  PatchQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  PatchOutput extends OutputObject = OutputObject
> {
  [ValidMethod.GET]?: MethodHandler<GetBodySchema, GetQuerySchema, GetOutput>;
  [ValidMethod.PUT]?: MethodHandler<PutBodySchema, PutQuerySchema, PutOutput>;
  [ValidMethod.POST]?: MethodHandler<
    PostBodySchema,
    PostQuerySchema,
    PostOutput
  >;
  [ValidMethod.DELETE]?: MethodHandler<
    DeleteBodySchema,
    DeleteQuerySchema,
    DeleteOutput
  >;
  [ValidMethod.OPTIONS]?: MethodHandler<
    OptionsBodySchema,
    OptionsQuerySchema,
    OptionsOutput
  >;
  [ValidMethod.HEAD]?: MethodHandler<
    HeadBodySchema,
    HeadQuerySchema,
    HeadOutput
  >;
  [ValidMethod.PATCH]?: MethodHandler<
    PatchBodySchema,
    PatchQuerySchema,
    PatchOutput
  >;
  openApiSpecOverrides?: OpenAPIV3_1.PathItemObject;
}

export interface DefineApiRouteParams<
  GetBodySchema extends BaseSchemaType = BaseSchemaType,
  GetQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  GetOutput extends OutputObject = OutputObject,
  PutBodySchema extends BaseSchemaType = BaseSchemaType,
  PutQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  PutOutput extends OutputObject = OutputObject,
  PostBodySchema extends BaseSchemaType = BaseSchemaType,
  PostQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  PostOutput extends OutputObject = OutputObject,
  DeleteBodySchema extends BaseSchemaType = BaseSchemaType,
  DeleteQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  DeleteOutput extends OutputObject = OutputObject,
  OptionsBodySchema extends BaseSchemaType = BaseSchemaType,
  OptionsQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  OptionsOutput extends OutputObject = OutputObject,
  HeadBodySchema extends BaseSchemaType = BaseSchemaType,
  HeadQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  HeadOutput extends OutputObject = OutputObject,
  PatchBodySchema extends BaseSchemaType = BaseSchemaType,
  PatchQuerySchema extends BaseObjectSchemaType = BaseObjectSchemaType,
  PatchOutput extends OutputObject = OutputObject
> {
  [ValidMethod.GET]?: ApiRouteMethodHandler<
    GetBodySchema,
    GetQuerySchema,
    GetOutput
  >;
  [ValidMethod.PUT]?: ApiRouteMethodHandler<
    PutBodySchema,
    PutQuerySchema,
    PutOutput
  >;
  [ValidMethod.POST]?: ApiRouteMethodHandler<
    PostBodySchema,
    PostQuerySchema,
    PostOutput
  >;
  [ValidMethod.DELETE]?: ApiRouteMethodHandler<
    DeleteBodySchema,
    DeleteQuerySchema,
    DeleteOutput
  >;
  [ValidMethod.OPTIONS]?: ApiRouteMethodHandler<
    OptionsBodySchema,
    OptionsQuerySchema,
    OptionsOutput
  >;
  [ValidMethod.HEAD]?: ApiRouteMethodHandler<
    HeadBodySchema,
    HeadQuerySchema,
    HeadOutput
  >;
  [ValidMethod.PATCH]?: ApiRouteMethodHandler<
    PatchBodySchema,
    PatchQuerySchema,
    PatchOutput
  >;
  openApiSpecOverrides?: OpenAPIV3_1.PathItemObject;
}
