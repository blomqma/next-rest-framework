/* eslint-disable @typescript-eslint/no-invalid-void-type */

import {
  type BaseStatus,
  type BaseQuery,
  type InputObject,
  type OutputObject,
  type BaseContentType,
  type Modify,
  type AnyCase,
  type OpenApiOperation
} from '../types';
import { type NextRequest, type NextResponse } from 'next/server';
import { type z } from 'zod';
import { type ValidMethod } from '../constants';
import { type I18NConfig } from 'next/dist/server/config-shared';
import { type ResponseCookies } from 'next/dist/server/web/spec-extension/cookies';
import { type NextURL } from 'next/dist/server/web/next-url';

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

// A patched `NextResponse` that allows to strongly-typed status code and content-type.
export declare class TypedNextResponse<
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
  ): TypedNextResponse<Body, Status, ContentType>;

  static redirect<
    Status extends BaseStatus,
    ContentType extends BaseContentType
  >(
    url: string | NextURL | URL,
    init?: number | TypedResponseInit<Status, ContentType>
  ): TypedNextResponse<unknown, Status, ContentType>;

  static rewrite<
    Status extends BaseStatus,
    ContentType extends BaseContentType
  >(
    destination: string | NextURL | URL,
    init?: TypedMiddlewareResponseInit<Status>
  ): TypedNextResponse<unknown, Status, ContentType>;

  static next<Status extends BaseStatus, ContentType extends BaseContentType>(
    init?: TypedMiddlewareResponseInit<Status>
  ): TypedNextResponse<unknown, Status, ContentType>;
}

type TypedNextRequest<Body, Query extends BaseQuery> = Modify<
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

type RouteHandler<
  Body = unknown,
  Query extends BaseQuery = BaseQuery,
  ResponseBody = unknown,
  Status extends BaseStatus = BaseStatus,
  ContentType extends BaseContentType = BaseContentType,
  Output extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>,
  TypedResponse =
    | TypedNextResponse<
        z.infer<Output[number]['schema']>,
        Output[number]['status'],
        Output[number]['contentType']
      >
    | NextResponse<z.infer<Output[number]['schema']>>
    | void
> = (
  req: TypedNextRequest<Body, Query>,
  context: { params: Record<string, string> }
) => Promise<TypedResponse> | TypedResponse;

type RouteOutput<
  Middleware extends boolean = false,
  Body = unknown,
  Query extends BaseQuery = BaseQuery
> = <
  ResponseBody,
  Status extends BaseStatus,
  ContentType extends BaseContentType,
  Output extends ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>
>(
  params?: Output
) => {
  handler: (
    callback?: RouteHandler<
      Body,
      Query,
      ResponseBody,
      Status,
      ContentType,
      Output
    >
  ) => RouteOperationDefinition;
} & (Middleware extends true
  ? {
      middleware: (
        callback?: RouteHandler<
          unknown,
          BaseQuery,
          ResponseBody,
          Status,
          ContentType,
          Output
        >
      ) => {
        handler: (
          callback?: RouteHandler<
            Body,
            Query,
            ResponseBody,
            Status,
            ContentType,
            Output
          >
        ) => RouteOperationDefinition;
      };
    }
  : Record<string, unknown>);

type RouteInput<Middleware extends boolean = false> = <
  Body,
  Query extends BaseQuery
>(
  params?: InputObject<Body, Query>
) => {
  output: RouteOutput<Middleware, Body, Query>;
  handler: (callback?: RouteHandler<Body, Query>) => RouteOperationDefinition;
} & (Middleware extends true
  ? {
      middleware: (callback?: RouteHandler) => {
        output: RouteOutput<false, Body, Query>;
        handler: (
          callback?: RouteHandler<Body, Query>
        ) => RouteOperationDefinition;
      };
    }
  : Record<string, unknown>);

type NextRouteHandler = (
  req: NextRequest,
  context: { params: BaseQuery }
) => Promise<NextResponse> | NextResponse | Promise<void> | void;

export interface RouteOperationDefinition {
  _meta: {
    openApiOperation?: OpenApiOperation;
    input?: InputObject;
    output?: readonly OutputObject[];
    middleware?: NextRouteHandler;
    handler?: NextRouteHandler;
  };
}

type RouteOperation = (openApiOperation?: OpenApiOperation) => {
  input: RouteInput<true>;
  output: RouteOutput<true>;
  middleware: (middleware?: RouteHandler) => {
    handler: (callback?: RouteHandler) => RouteOperationDefinition;
  };
  handler: (callback?: RouteHandler) => RouteOperationDefinition;
};

export const routeOperation: RouteOperation = (openApiOperation) => {
  const createConfig = <Middleware, Handler>(
    input: InputObject | undefined,
    output: readonly OutputObject[] | undefined,
    middleware: Middleware | undefined,
    handler: Handler | undefined
  ): RouteOperationDefinition => ({
    _meta: {
      openApiOperation,
      input,
      output,
      middleware: middleware as NextRouteHandler,
      handler: handler as NextRouteHandler
    }
  });

  return {
    input: (input) => ({
      output: (output) => ({
        middleware: (middleware) => ({
          handler: (handler) => createConfig(input, output, middleware, handler)
        }),
        handler: (handler) => createConfig(input, output, undefined, handler)
      }),
      middleware: (middleware) => ({
        output: (output) => ({
          handler: (handler) => createConfig(input, output, middleware, handler)
        }),
        handler: (handler) =>
          createConfig(input, undefined, middleware, handler)
      }),
      handler: (handler) => createConfig(input, undefined, undefined, handler)
    }),
    output: (output) => ({
      middleware: (middleware) => ({
        handler: (handler) =>
          createConfig(undefined, output, middleware, handler)
      }),
      handler: (handler) => createConfig(undefined, output, undefined, handler)
    }),
    middleware: (middleware) => ({
      handler: (handler) =>
        createConfig(undefined, undefined, middleware, handler)
    }),
    handler: (handler) => createConfig(undefined, undefined, undefined, handler)
  };
};
