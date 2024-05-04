/* eslint-disable @typescript-eslint/no-invalid-void-type */

import {
  type BaseStatus,
  type BaseQuery,
  type OutputObject,
  type Modify,
  type AnyCase,
  type OpenApiOperation,
  type BaseParams,
  type BaseOptions,
  type TypedFormData,
  type AnyContentTypeWithAutocompleteForMostCommonOnes,
  type BaseContentType,
  type ZodFormSchema,
  type FormDataContentType,
  type ContentTypesThatSupportInputValidation
} from '../types';
import { NextResponse, type NextRequest } from 'next/server';
import { type ZodSchema, type z } from 'zod';
import { type ValidMethod } from '../constants';
import { type I18NConfig } from 'next/dist/server/config-shared';
import { type NextURL } from 'next/dist/server/web/next-url';
import { type OpenAPIV3_1 } from 'openapi-types';
import { type ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';

interface TypedSearchParams<Query = BaseQuery> extends URLSearchParams {
  get: <K extends keyof Query & string>(key: K) => string | null;
  getAll: <K extends keyof Query & string>(key: K) => string[];
}

interface TypedNextURL<Query = BaseQuery> extends NextURL {
  searchParams: TypedSearchParams<Query>;
}

export interface TypedNextRequest<
  Method extends string = keyof typeof ValidMethod,
  ContentType = BaseContentType,
  Body = unknown,
  Query = BaseQuery
> extends NextRequest {
  method: Method;
  /*! Prevent parsing JSON body for GET requests. Form requests return parsed form data as JSON when the form schema is defined. */
  json: Method extends 'GET' ? never : () => Promise<Body>;
  /*! Prevent parsing form data for GET and non-form requests. */
  formData: Method extends 'GET'
    ? never
    : ContentType extends FormDataContentType
    ? () => Promise<TypedFormData<Body>>
    : never;
  nextUrl: TypedNextURL<Query>;
}

type TypedHeaders<ContentType extends BaseContentType> = Modify<
  Record<string, string>,
  {
    [K in AnyCase<'Content-Type'>]?: ContentType;
  }
>;

interface TypedResponseInit<
  Status extends BaseStatus,
  ContentType extends BaseContentType
> extends globalThis.ResponseInit {
  nextConfig?: {
    basePath?: string;
    i18n?: I18NConfig;
    trailingSlash?: boolean;
  };
  url?: string;
  status?: Status;
  headers?: TypedHeaders<ContentType>;
}

interface ModifiedRequest {
  headers?: Headers;
}

interface TypedMiddlewareResponseInit<Status extends BaseStatus>
  extends globalThis.ResponseInit {
  request?: ModifiedRequest;
  status?: Status;
}

declare const INTERNALS: unique symbol;

// A patched `NextResponse` that sets strongly-typed properties.
export declare class TypedNextResponseType<
  Body,
  Status extends BaseStatus,
  ContentType extends BaseContentType
> extends Response {
  [INTERNALS]: {
    cookies: ResponseCookies;
    url?: NextURL;
    body?: Body;
    status?: Status;
    contentType?: ContentType;
  };

  constructor(
    body?: BodyInit | null,
    init?: TypedResponseInit<Status, ContentType>
  );

  get cookies(): ResponseCookies;

  static json<
    Body,
    Status extends BaseStatus,
    ContentType extends BaseContentType
  >(
    body: Body,
    init?: TypedResponseInit<Status, ContentType>
  ): TypedNextResponseType<Body, Status, ContentType>;

  static redirect<
    Status extends BaseStatus,
    ContentType extends BaseContentType
  >(
    url: string | NextURL | URL,
    init?: number | TypedResponseInit<Status, ContentType>
  ): TypedNextResponseType<unknown, Status, ContentType>;

  static rewrite<
    Status extends BaseStatus,
    ContentType extends BaseContentType
  >(
    destination: string | NextURL | URL,
    init?: TypedMiddlewareResponseInit<Status>
  ): TypedNextResponseType<unknown, Status, ContentType>;

  static next<Status extends BaseStatus, ContentType extends BaseContentType>(
    init?: TypedMiddlewareResponseInit<Status>
  ): TypedNextResponseType<unknown, Status, ContentType>;
}

// @ts-expect-error - Keep the original NextResponse functionality with custom types.
export const TypedNextResponse: typeof TypedNextResponseType = NextResponse;

type RouteMiddleware<
  InputOptions extends BaseOptions = BaseOptions,
  OutputOptions extends BaseOptions = BaseOptions,
  ResponseBody = unknown,
  Status extends BaseStatus = BaseStatus,
  ResponseContentType extends
    AnyContentTypeWithAutocompleteForMostCommonOnes = AnyContentTypeWithAutocompleteForMostCommonOnes,
  Outputs extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ResponseContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ResponseContentType>>,
  TypedResponse =
    | TypedNextResponseType<
        z.infer<Outputs[number]['body']>,
        Outputs[number]['status'],
        Outputs[number]['contentType']
      >
    | NextResponse<z.infer<Outputs[number]['body']>>
    | void
> = (
  req: NextRequest,
  context: { params: BaseParams },
  options: InputOptions
) => Promise<TypedResponse | OutputOptions> | TypedResponse | OutputOptions;

type TypedRouteHandler<
  Method extends keyof typeof ValidMethod = keyof typeof ValidMethod,
  ContentType extends BaseContentType = BaseContentType,
  Body = unknown,
  Query extends BaseQuery = BaseQuery,
  Params extends BaseParams = BaseParams,
  Options extends BaseOptions = BaseOptions,
  ResponseBody = unknown,
  Status extends BaseStatus = BaseStatus,
  ResponseContentType extends BaseContentType = BaseContentType,
  Outputs extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ResponseContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ResponseContentType>>,
  TypedResponse =
    | TypedNextResponseType<
        z.infer<Outputs[number]['body']>,
        Outputs[number]['status'],
        Outputs[number]['contentType']
      >
    | NextResponse<z.infer<Outputs[number]['body']>>
    | void
> = (
  req: TypedNextRequest<Method, ContentType, Body, Query>,
  context: { params: Params },
  options: Options
) => Promise<TypedResponse> | TypedResponse;

interface InputObject<
  ContentType = BaseContentType,
  Body = unknown,
  Query = BaseQuery,
  Params = BaseParams
> {
  contentType?: ContentType;
  /*! Body schema is supported only for certain content types that support input validation. */
  body?: ContentType extends ContentTypesThatSupportInputValidation
    ? ContentType extends FormDataContentType
      ? ZodFormSchema<Body>
      : ZodSchema<Body>
    : never;
  /*! If defined, this will override the body schema for the OpenAPI spec. */
  bodySchema?: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
  query?: ZodSchema<Query>;
  /*! If defined, this will override the query schema for the OpenAPI spec. */
  querySchema?: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
  params?: ZodSchema<Params>;
  /*! If defined, this will override the params schema for the OpenAPI spec. */
  paramsSchema?: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
}

export interface RouteOperationDefinition<
  Method extends keyof typeof ValidMethod = keyof typeof ValidMethod
> {
  openApiOperation?: OpenApiOperation;
  method: Method;
  input?: InputObject;
  outputs?: readonly OutputObject[];
  middleware1?: RouteMiddleware;
  middleware2?: RouteMiddleware;
  middleware3?: RouteMiddleware;
  handler?: TypedRouteHandler;
}

// Build function chain for a route operation.
export const routeOperation = <Method extends keyof typeof ValidMethod>({
  openApiOperation,
  method
}: {
  openApiOperation?: OpenApiOperation;
  method: Method;
}) => {
  const createOperation = ({
    input,
    outputs,
    middleware1,
    middleware2,
    middleware3,
    handler
  }: {
    input?: InputObject;
    outputs?: readonly OutputObject[];
    middleware1?: RouteMiddleware<any, any>;
    middleware2?: RouteMiddleware<any, any>;
    middleware3?: RouteMiddleware<any, any>;
    handler?: TypedRouteHandler<any, any, any, any, any, any>;
  }): RouteOperationDefinition<Method> => ({
    openApiOperation,
    method,
    input,
    outputs,
    middleware1,
    middleware2,
    middleware3,
    handler
  });

  return {
    input: <
      ContentType extends BaseContentType,
      Body,
      Query extends BaseQuery,
      Params extends BaseParams
    >(
      input: InputObject<ContentType, Body, Query, Params>
    ) => ({
      outputs: <
        ResponseBody,
        Status extends BaseStatus,
        ResponseContentType extends BaseContentType,
        Outputs extends ReadonlyArray<
          OutputObject<ResponseBody, Status, ResponseContentType>
        >
      >(
        outputs: Outputs
      ) => ({
        middleware: <Options1 extends BaseOptions>(
          middleware1: RouteMiddleware<
            BaseOptions,
            Options1,
            ResponseBody,
            Status,
            ResponseContentType,
            Outputs
          >
        ) => ({
          middleware: <Options2 extends BaseOptions>(
            middleware2: RouteMiddleware<
              Options1,
              Options2,
              ResponseBody,
              Status,
              ResponseContentType,
              Outputs
            >
          ) => ({
            middleware: <Options3 extends BaseOptions>(
              middleware3: RouteMiddleware<
                Options2,
                Options3,
                ResponseBody,
                Status,
                ResponseContentType,
                Outputs
              >
            ) => ({
              handler: (
                handler: TypedRouteHandler<
                  Method,
                  ContentType,
                  Body,
                  Query,
                  Params,
                  Options3,
                  ResponseBody,
                  Status,
                  ResponseContentType,
                  Outputs
                >
              ) =>
                createOperation({
                  input,
                  outputs,
                  middleware1,
                  middleware2,
                  middleware3,
                  handler
                })
            }),
            handler: (
              handler: TypedRouteHandler<
                Method,
                ContentType,
                Body,
                Query,
                Params,
                Options2,
                ResponseBody,
                Status,
                ResponseContentType,
                Outputs
              >
            ) =>
              createOperation({
                input,
                outputs,
                middleware1,
                middleware2,
                handler
              })
          }),
          handler: (
            handler: TypedRouteHandler<
              Method,
              ContentType,
              Body,
              Query,
              Params,
              Options1,
              ResponseBody,
              Status,
              ResponseContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware1, handler })
        }),
        handler: (
          handler: TypedRouteHandler<
            Method,
            ContentType,
            Body,
            Query,
            Params,
            BaseOptions,
            ResponseBody,
            Status,
            ResponseContentType,
            Outputs
          >
        ) => createOperation({ input, outputs, handler })
      }),
      middleware: <Options1 extends BaseOptions>(
        middleware1: RouteMiddleware<BaseOptions, Options1>
      ) => ({
        middleware: <Options2 extends BaseOptions>(
          middleware2: RouteMiddleware<Options1, Options2>
        ) => ({
          middleware: <Options3 extends BaseOptions>(
            middleware3: RouteMiddleware<Options2, Options3>
          ) => ({
            outputs: <
              ResponseBody,
              Status extends BaseStatus,
              ResponseContentType extends BaseContentType,
              Outputs extends ReadonlyArray<
                OutputObject<ResponseBody, Status, ResponseContentType>
              >
            >(
              outputs: Outputs
            ) => ({
              handler: (
                handler: TypedRouteHandler<
                  Method,
                  ContentType,
                  Body,
                  Query,
                  Params,
                  Options3,
                  ResponseBody,
                  Status,
                  ResponseContentType,
                  Outputs
                >
              ) =>
                createOperation({
                  input,
                  outputs,
                  middleware1,
                  middleware2,
                  middleware3,
                  handler
                })
            }),
            handler: (
              handler: TypedRouteHandler<
                Method,
                ContentType,
                Body,
                Query,
                Params,
                Options2
              >
            ) => createOperation({ input, middleware1, middleware2, handler })
          }),
          outputs: <
            ResponseBody,
            Status extends BaseStatus,
            ResponseContentType extends BaseContentType,
            Outputs extends ReadonlyArray<
              OutputObject<ResponseBody, Status, ResponseContentType>
            >
          >(
            outputs: Outputs
          ) => ({
            handler: (
              handler: TypedRouteHandler<
                Method,
                ContentType,
                Body,
                Query,
                Params,
                Options2,
                ResponseBody,
                Status,
                ResponseContentType,
                Outputs
              >
            ) =>
              createOperation({
                input,
                outputs,
                middleware1,
                middleware2,
                handler
              })
          }),
          handler: (
            handler: TypedRouteHandler<
              Method,
              ContentType,
              Body,
              Query,
              Params,
              Options2
            >
          ) => createOperation({ input, middleware1, middleware2, handler })
        }),
        outputs: <
          ResponseBody,
          Status extends BaseStatus,
          ResponseContentType extends BaseContentType,
          Outputs extends ReadonlyArray<
            OutputObject<ResponseBody, Status, ResponseContentType>
          >
        >(
          outputs: Outputs
        ) => ({
          handler: (
            handler: TypedRouteHandler<
              Method,
              ContentType,
              Body,
              Query,
              Params,
              Options1,
              ResponseBody,
              Status,
              ResponseContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware1, handler })
        }),
        handler: (
          handler: TypedRouteHandler<
            Method,
            ContentType,
            Body,
            Query,
            Params,
            Options1
          >
        ) => createOperation({ input, middleware1, handler })
      }),
      handler: (
        handler: TypedRouteHandler<Method, ContentType, Body, Query, Params>
      ) => createOperation({ input, handler })
    }),
    outputs: <
      ResponseBody,
      Status extends BaseStatus,
      ResponseContentType extends BaseContentType,
      Outputs extends ReadonlyArray<
        OutputObject<ResponseBody, Status, ResponseContentType>
      >
    >(
      outputs: Outputs
    ) => ({
      middleware: <Options1 extends BaseOptions>(
        middleware1: RouteMiddleware<
          BaseOptions,
          Options1,
          ResponseBody,
          Status,
          ResponseContentType,
          Outputs
        >
      ) => ({
        middleware: <Options2 extends BaseOptions>(
          middleware2: RouteMiddleware<
            Options1,
            Options2,
            ResponseBody,
            Status,
            ResponseContentType,
            Outputs
          >
        ) => ({
          middleware: <Options3 extends BaseOptions>(
            middleware3: RouteMiddleware<
              Options2,
              Options3,
              ResponseBody,
              Status,
              ResponseContentType,
              Outputs
            >
          ) => ({
            handler: (
              handler: TypedRouteHandler<
                Method,
                BaseContentType,
                unknown,
                BaseQuery,
                BaseParams,
                Options3,
                ResponseBody,
                Status,
                ResponseContentType,
                Outputs
              >
            ) =>
              createOperation({
                outputs,
                middleware1,
                middleware2,
                middleware3,
                handler
              })
          }),
          handler: (
            handler: TypedRouteHandler<
              Method,
              BaseContentType,
              unknown,
              BaseQuery,
              BaseParams,
              Options2,
              ResponseBody,
              Status,
              ResponseContentType,
              Outputs
            >
          ) => createOperation({ outputs, middleware1, middleware2, handler })
        }),
        handler: (
          handler: TypedRouteHandler<
            Method,
            BaseContentType,
            unknown,
            BaseQuery,
            BaseParams,
            Options1,
            ResponseBody,
            Status,
            ResponseContentType,
            Outputs
          >
        ) => createOperation({ outputs, middleware1, handler })
      }),
      handler: (
        handler: TypedRouteHandler<
          Method,
          BaseContentType,
          unknown,
          BaseQuery,
          BaseParams,
          BaseOptions,
          ResponseBody,
          Status,
          ResponseContentType,
          Outputs
        >
      ) => createOperation({ outputs, handler })
    }),
    middleware: <Options1 extends BaseOptions>(
      middleware1: RouteMiddleware<BaseOptions, Options1>
    ) => ({
      middleware: <Options2 extends BaseOptions>(
        middleware2: RouteMiddleware<Options1, Options2>
      ) => ({
        middleware: <Options3 extends BaseOptions>(
          middleware3: RouteMiddleware<Options2, Options3>
        ) => ({
          handler: (
            handler: TypedRouteHandler<
              Method,
              BaseContentType,
              unknown,
              BaseQuery,
              BaseParams,
              Options3
            >
          ) =>
            createOperation({ middleware1, middleware2, middleware3, handler })
        }),
        handler: (
          handler: TypedRouteHandler<
            Method,
            BaseContentType,
            unknown,
            BaseQuery,
            BaseParams,
            Options2
          >
        ) => createOperation({ middleware1, middleware2, handler })
      }),
      handler: (
        handler: TypedRouteHandler<
          Method,
          BaseContentType,
          unknown,
          BaseQuery,
          BaseParams,
          Options1
        >
      ) => createOperation({ middleware1, handler })
    }),
    handler: (handler: TypedRouteHandler) => createOperation({ handler })
  };
};
