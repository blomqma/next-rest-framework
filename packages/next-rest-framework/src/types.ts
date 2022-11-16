import { z } from 'zod';
import * as yup from 'yup';
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAPIV3_1 } from 'openapi-types';
import { ValidMethod } from './constants';
import { AnyCase, Modify } from './utility-types';
import { AnyContentTypeWithAutocompleteForMostCommonOnes } from './content-types';

export type BaseStatus = number;
export type BaseContentType = AnyContentTypeWithAutocompleteForMostCommonOnes;

export type TypedNextApiRequest<Body = unknown> = Modify<
  NextApiRequest,
  {
    body: Body;
    method: ValidMethod;
  }
>;

export type TypedNextApiResponse<Status, ContentType, Response> = Modify<
  Omit<NextApiResponse<Response>, 'send' | 'json'>,
  {
    status: (code: Status) => Omit<NextApiResponse<Response>, 'status'>;
    setHeader: <
      K extends AnyCase<'Content-Type'> | string,
      V extends number | string | readonly string[]
    >(
      name: K,
      value: K extends AnyCase<'Content-Type'> ? ContentType : V
    ) => void;
  }
>;

type NextRestFrameworkOpenApiSpec = Partial<
  Modify<
    Omit<OpenAPIV3_1.Document, 'openapi'>,
    {
      info: Partial<OpenAPIV3_1.InfoObject>;
    }
  >
>;

export type ResponseObject<
  Status = unknown,
  ContentType = unknown,
  Response = unknown
> = Modify<
  Omit<OpenAPIV3_1.ResponseObject, 'content'> & OpenAPIV3_1.MediaTypeObject,
  {
    status: Status;
    schema: z.ZodType<Response> | yup.SchemaOf<Response>;
    contentType: ContentType;
    description?: string;
  }
>;

type ExampleObject<Body> = Modify<
  OpenAPIV3_1.ExampleObject,
  {
    value: Body;
  }
>;

export type RequestBodyObject<Body> = Omit<
  OpenAPIV3_1.RequestBodyObject,
  'content'
> &
  Modify<
    OpenAPIV3_1.MediaTypeObject,
    {
      description?: string;
      required?: boolean;
      contentType: BaseContentType;
      schema: z.ZodType<Body> | yup.SchemaOf<Body>;
      example?: Body;
      examples?: Record<
        string,
        OpenAPIV3_1.ReferenceObject | ExampleObject<Body>
      >;
    }
  >;

type ApiHandler<
  Body,
  Status,
  ContentType,
  Response,
  GlobalMiddlewareResponse,
  RouteMiddlewareResponse,
  MethodMiddlewareResponse
> = (params: {
  req: TypedNextApiRequest<Body>;
  res: TypedNextApiResponse<Status, ContentType, Response>;
  params:
    | Record<string, never>
    | (Awaited<GlobalMiddlewareResponse> &
        Awaited<RouteMiddlewareResponse> &
        Awaited<MethodMiddlewareResponse>);
}) => Promise<void> | void;

type Middleware<
  MiddlewareResponse,
  ExtraParams = unknown,
  Req = NextApiRequest,
  Res = NextApiResponse
> = (
  params: {
    req: Req;
    res: Res;
  } & ExtraParams
) =>
  | Promise<(MiddlewareResponse & Record<string, unknown>) | undefined>
  | (MiddlewareResponse & Record<string, unknown>)
  | undefined;

type ErrorHandler<
  ExtraParams = unknown,
  Req = NextApiRequest,
  Res = NextApiResponse
> = ({
  req,
  res,
  error
}: {
  req: Req;
  res: Res;
  error: unknown;
} & ExtraParams) => Promise<void> | void;

type SchemaOutput<Schema> = Schema extends z.ZodType
  ? Schema['_output']
  : Schema extends yup.AnySchema
  ? Schema['__outputType']
  : never;

export type MethodHandler<
  Body = unknown,
  Status extends BaseStatus = BaseStatus,
  ContentType extends BaseContentType = BaseContentType,
  Response extends ResponseObject = ResponseObject,
  GlobalMiddlewareResponse = unknown,
  RouteMiddlewareResponse = unknown,
  MethodMiddlewareResponse = unknown
> = Modify<
  OpenAPIV3_1.OperationObject,
  {
    requestBody?: RequestBodyObject<Body>;
    responses: Array<
      Response & {
        status: Status;
        contentType: ContentType;
      }
    >;
    middleware?: Middleware<
      MethodMiddlewareResponse,
      {
        params: GlobalMiddlewareResponse & RouteMiddlewareResponse;
      },
      TypedNextApiRequest<Body>,
      TypedNextApiResponse<
        Status,
        ContentType,
        SchemaOutput<Response['schema']>
      >
    >;
    handler: ApiHandler<
      Body,
      Status,
      ContentType,
      SchemaOutput<Response['schema']>,
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
      TypedNextApiRequest<Body>,
      TypedNextApiResponse<
        Status,
        ContentType,
        SchemaOutput<Response['schema']>
      >
    >;
  }
>;

export interface DefineEndpointsParams<
  GetBody = unknown,
  GetStatus extends BaseStatus = BaseStatus,
  GetContentType extends BaseContentType = BaseContentType,
  GetResponse extends ResponseObject = ResponseObject,
  GetMiddlewareResponse = unknown,
  PutBody = unknown,
  PutStatus extends BaseStatus = BaseStatus,
  PutContentType extends BaseContentType = BaseContentType,
  PutResponse extends ResponseObject = ResponseObject,
  PutMiddlewareResponse = unknown,
  PostBody = unknown,
  PostStatus extends BaseStatus = BaseStatus,
  PostContentType extends BaseContentType = BaseContentType,
  PostResponse extends ResponseObject = ResponseObject,
  PostMiddlewareResponse = unknown,
  DeleteBody = unknown,
  DeleteStatus extends BaseStatus = BaseStatus,
  DeleteContentType extends BaseContentType = BaseContentType,
  DeleteResponse extends ResponseObject = ResponseObject,
  DeleteMiddlewareResponse = unknown,
  OptionsBody = unknown,
  OptionsStatus extends BaseStatus = BaseStatus,
  OptionsContentType extends BaseContentType = BaseContentType,
  OptionsResponse extends ResponseObject = ResponseObject,
  OptionsMiddlewareResponse = unknown,
  HeadBody = unknown,
  HeadStatus extends BaseStatus = BaseStatus,
  HeadContentType extends BaseContentType = BaseContentType,
  HeadResponse extends ResponseObject = ResponseObject,
  HeadMiddlewareResponse = unknown,
  PatchBody = unknown,
  PatchStatus extends BaseStatus = BaseStatus,
  PatchContentType extends BaseContentType = BaseContentType,
  PatchResponse extends ResponseObject = ResponseObject,
  PatchMiddlewareResponse = unknown,
  TraceBody = unknown,
  TraceStatus extends BaseStatus = BaseStatus,
  TraceContentType extends BaseContentType = BaseContentType,
  TraceResponse extends ResponseObject = ResponseObject,
  TraceMiddlewareResponse = unknown,
  GlobalMiddlewareResponse = unknown,
  RouteMiddlewareResponse = unknown
> {
  [ValidMethod.GET]?: MethodHandler<
    GetBody,
    GetStatus,
    GetContentType,
    GetResponse,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    GetMiddlewareResponse
  >;
  [ValidMethod.PUT]?: MethodHandler<
    PutBody,
    PutStatus,
    PutContentType,
    PutResponse,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PutMiddlewareResponse
  >;
  [ValidMethod.POST]?: MethodHandler<
    PostBody,
    PostStatus,
    PostContentType,
    PostResponse,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PostMiddlewareResponse
  >;
  [ValidMethod.DELETE]?: MethodHandler<
    DeleteBody,
    DeleteStatus,
    DeleteContentType,
    DeleteResponse,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    DeleteMiddlewareResponse
  >;
  [ValidMethod.OPTIONS]?: MethodHandler<
    OptionsBody,
    OptionsStatus,
    OptionsContentType,
    OptionsResponse,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    OptionsMiddlewareResponse
  >;
  [ValidMethod.HEAD]?: MethodHandler<
    HeadBody,
    HeadStatus,
    HeadContentType,
    HeadResponse,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    HeadMiddlewareResponse
  >;
  [ValidMethod.PATCH]?: MethodHandler<
    PatchBody,
    PatchStatus,
    PatchContentType,
    PatchResponse,
    GlobalMiddlewareResponse,
    RouteMiddlewareResponse,
    PatchMiddlewareResponse
  >;
  [ValidMethod.TRACE]?: MethodHandler<
    TraceBody,
    TraceStatus,
    TraceContentType,
    TraceResponse,
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
  $ref?: OpenAPIV3_1.ReferenceObject;
  description?: OpenAPIV3_1.PathItemObject['description'];
  servers?: OpenAPIV3_1.ServerObject[];
  parameters?: OpenAPIV3_1.PathItemObject['parameters'];
}

export interface NextRestFrameworkConfig<GlobalMiddlewareResponse = unknown> {
  openApiSpec?: NextRestFrameworkOpenApiSpec; // Fully typed OpenAPI spec for your API.
  openApiJsonPath?: string; // Path that will be used for the OpenAPI spec - defaults tp `/api/openapi.json`.
  openApiYamlPath?: string; // Path that will be used for the OpenAPI spec - defaults tp `/api/openapi.json`.
  swaggerUiPath?: string; // Path that will be used for the API docs - defaults to `/api/docs`.
  exposeOpenApiSpec?: boolean; // Setting this to `false` will expose neither the API docs nor the OpenAPI specs.
  middleware?: Middleware<GlobalMiddlewareResponse>; // A middleware used for all of your APIs - useful for e.g. authentication. The return object will be passed to your request handlers.
  errorHandler?: ErrorHandler; // A function that will be called when an error occurs. By default, it will return a 500 status code and a default error unless your provide a custom response.
  suppressInfo?: boolean; // Setting this to `true` will suppress all informational logs from Next REST Framework.
}
