/* eslint-disable @typescript-eslint/no-invalid-void-type */

import {
  type BaseStatus,
  type BaseQuery,
  type OutputObject,
  type BaseContentType,
  type Modify,
  type AnyCase,
  type OpenApiOperation,
  type BaseParams,
  type BaseOptions
} from '../types';
import { NextResponse, type NextRequest } from 'next/server';
import { type ZodSchema, type z } from 'zod';
import { type ValidMethod } from '../constants';
import { type I18NConfig } from 'next/dist/server/config-shared';
import { type ResponseCookies } from 'next/dist/server/web/spec-extension/cookies';
import { type NextURL } from 'next/dist/server/web/next-url';

export type TypedNextRequest<Body = unknown, Query = BaseQuery> = Modify<
  NextRequest,
  {
    json: () => Promise<Body>;
    method: ValidMethod;
    nextUrl: Modify<
      NextURL,
      {
        searchParams: Modify<
          URLSearchParams,
          {
            get: (key: keyof Query) => string | null;
            getAll: (key: keyof Query) => string[];
          }
        >;
      }
    >;
  }
>;

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
  ContentType extends BaseContentType = BaseContentType,
  Outputs extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>,
  TypedResponse =
    | TypedNextResponseType<
        z.infer<Outputs[number]['schema']>,
        Outputs[number]['status'],
        Outputs[number]['contentType']
      >
    | NextResponse<z.infer<Outputs[number]['schema']>>
    | void
> = (
  req: NextRequest,
  context: { params: BaseParams },
  options: InputOptions
) =>
  | Promise<TypedResponse>
  | TypedResponse
  | Promise<OutputOptions>
  | OutputOptions;

type TypedRouteHandler<
  Body = unknown,
  Query extends BaseQuery = BaseQuery,
  Params extends BaseParams = BaseParams,
  Options extends BaseOptions = BaseOptions,
  ResponseBody = unknown,
  Status extends BaseStatus = BaseStatus,
  ContentType extends BaseContentType = BaseContentType,
  Outputs extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>,
  TypedResponse =
    | TypedNextResponseType<
        z.infer<Outputs[number]['schema']>,
        Outputs[number]['status'],
        Outputs[number]['contentType']
      >
    | NextResponse<z.infer<Outputs[number]['schema']>>
    | void
> = (
  req: TypedNextRequest<Body, Query>,
  context: { params: Params },
  options: Options
) => Promise<TypedResponse> | TypedResponse;

interface InputObject<Body = unknown, Query = BaseQuery, Params = BaseParams> {
  contentType?: BaseContentType;
  body?: ZodSchema<Body>;
  query?: ZodSchema<Query>;
  params?: ZodSchema<Params>;
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
    handler?: TypedRouteHandler<any, any, any, any>;
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
    input: <Body, Query extends BaseQuery, Params extends BaseParams>(
      input: InputObject<Body, Query, Params>
    ) => ({
      outputs: <
        ResponseBody,
        Status extends BaseStatus,
        ContentType extends BaseContentType,
        Outputs extends ReadonlyArray<
          OutputObject<ResponseBody, Status, ContentType>
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
            ContentType,
            Outputs
          >
        ) => ({
          middleware: <Options2 extends BaseOptions>(
            middleware2: RouteMiddleware<
              Options1,
              Options2,
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => ({
            middleware: <Options3 extends BaseOptions>(
              middleware3: RouteMiddleware<
                Options2,
                Options3,
                ResponseBody,
                Status,
                ContentType,
                Outputs
              >
            ) => ({
              handler: (
                handler: TypedRouteHandler<
                  Body,
                  Query,
                  Params,
                  Options3,
                  ResponseBody,
                  Status,
                  ContentType,
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
                Body,
                Query,
                Params,
                Options2,
                ResponseBody,
                Status,
                ContentType,
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
              Body,
              Query,
              Params,
              Options1,
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware1, handler })
        }),
        handler: (
          handler: TypedRouteHandler<
            Body,
            Query,
            Params,
            BaseOptions,
            ResponseBody,
            Status,
            ContentType,
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
              ContentType extends BaseContentType,
              Outputs extends ReadonlyArray<
                OutputObject<ResponseBody, Status, ContentType>
              >
            >(
              outputs: Outputs
            ) => ({
              handler: (
                handler: TypedRouteHandler<
                  Body,
                  Query,
                  Params,
                  Options3,
                  ResponseBody,
                  Status,
                  ContentType,
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
              handler: TypedRouteHandler<Body, Query, Params, Options2>
            ) => createOperation({ input, middleware1, middleware2, handler })
          }),
          outputs: <
            ResponseBody,
            Status extends BaseStatus,
            ContentType extends BaseContentType,
            Outputs extends ReadonlyArray<
              OutputObject<ResponseBody, Status, ContentType>
            >
          >(
            outputs: Outputs
          ) => ({
            handler: (
              handler: TypedRouteHandler<
                Body,
                Query,
                Params,
                Options2,
                ResponseBody,
                Status,
                ContentType,
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
            handler: TypedRouteHandler<Body, Query, Params, Options2>
          ) => createOperation({ input, middleware1, middleware2, handler })
        }),
        outputs: <
          ResponseBody,
          Status extends BaseStatus,
          ContentType extends BaseContentType,
          Outputs extends ReadonlyArray<
            OutputObject<ResponseBody, Status, ContentType>
          >
        >(
          outputs: Outputs
        ) => ({
          handler: (
            handler: TypedRouteHandler<
              Body,
              Query,
              Params,
              Options1,
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware1, handler })
        }),
        handler: (handler: TypedRouteHandler<Body, Query, Params, Options1>) =>
          createOperation({ input, middleware1, handler })
      }),
      handler: (handler: TypedRouteHandler<Body, Query, Params>) =>
        createOperation({ input, handler })
    }),
    outputs: <
      ResponseBody,
      Status extends BaseStatus,
      ContentType extends BaseContentType,
      Outputs extends ReadonlyArray<
        OutputObject<ResponseBody, Status, ContentType>
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
          ContentType,
          Outputs
        >
      ) => ({
        middleware: <Options2 extends BaseOptions>(
          middleware2: RouteMiddleware<
            Options1,
            Options2,
            ResponseBody,
            Status,
            ContentType,
            Outputs
          >
        ) => ({
          middleware: <Options3 extends BaseOptions>(
            middleware3: RouteMiddleware<
              Options2,
              Options3,
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => ({
            handler: (
              handler: TypedRouteHandler<
                unknown,
                BaseQuery,
                BaseParams,
                Options3,
                ResponseBody,
                Status,
                ContentType,
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
              unknown,
              BaseQuery,
              BaseParams,
              Options2,
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ outputs, middleware1, middleware2, handler })
        }),
        handler: (
          handler: TypedRouteHandler<
            unknown,
            BaseQuery,
            BaseParams,
            Options1,
            ResponseBody,
            Status,
            ContentType,
            Outputs
          >
        ) => createOperation({ outputs, middleware1, handler })
      }),
      handler: (
        handler: TypedRouteHandler<
          unknown,
          BaseQuery,
          BaseParams,
          BaseOptions,
          ResponseBody,
          Status,
          ContentType,
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
            handler: TypedRouteHandler<unknown, BaseQuery, BaseParams, Options3>
          ) =>
            createOperation({ middleware1, middleware2, middleware3, handler })
        }),
        handler: (
          handler: TypedRouteHandler<unknown, BaseQuery, BaseParams, Options2>
        ) => createOperation({ middleware1, middleware2, handler })
      }),
      handler: (
        handler: TypedRouteHandler<unknown, BaseQuery, BaseParams, Options1>
      ) => createOperation({ middleware1, handler })
    }),
    handler: (handler: TypedRouteHandler) => createOperation({ handler })
  };
};
