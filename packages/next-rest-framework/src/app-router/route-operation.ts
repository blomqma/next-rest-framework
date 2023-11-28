/* eslint-disable @typescript-eslint/no-invalid-void-type */

import {
  type BaseStatus,
  type BaseQuery,
  type OutputObject,
  type BaseContentType,
  type Modify,
  type AnyCase,
  type OpenApiOperation,
  type BaseParams
} from '../types';
import { NextResponse, type NextRequest } from 'next/server';
import { type ZodSchema, type z } from 'zod';
import { type ValidMethod } from '../constants';
import { type I18NConfig } from 'next/dist/server/config-shared';
import { type ResponseCookies } from 'next/dist/server/web/spec-extension/cookies';
import { type NextURL } from 'next/dist/server/web/next-url';

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

type TypedRouteHandler<
  Body = unknown,
  Query extends BaseQuery = BaseQuery,
  Params extends BaseParams = BaseParams,
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
  context: { params: Params }
) => Promise<TypedResponse> | TypedResponse;

type NextRouteHandler = (
  req: NextRequest,
  context: { params: BaseParams }
) => Promise<NextResponse> | NextResponse | Promise<void> | void;

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
  middleware?: NextRouteHandler;
  handler?: NextRouteHandler;
}

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
    middleware: _middleware,
    handler: _handler
  }: {
    input?: InputObject;
    outputs?: readonly OutputObject[];
    middleware?: TypedRouteHandler<any, any, any>;
    handler?: TypedRouteHandler<any, any, any>;
  }): RouteOperationDefinition<Method> => {
    const middleware = _middleware as NextRouteHandler;
    const handler = _handler as NextRouteHandler;

    return {
      openApiOperation,
      method,
      input,
      outputs,
      middleware,
      handler
    };
  };

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
        middleware: (
          middleware: TypedRouteHandler<
            unknown,
            BaseQuery,
            BaseParams,
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
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware, handler })
        }),
        handler: (
          handler: TypedRouteHandler<
            Body,
            Query,
            Params,
            ResponseBody,
            Status,
            ContentType,
            Outputs
          >
        ) => createOperation({ input, outputs, handler })
      }),
      middleware: (middleware: TypedRouteHandler) => ({
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
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware, handler })
        }),
        handler: (handler: TypedRouteHandler<Body, Query>) =>
          createOperation({ input, middleware, handler })
      }),
      handler: (handler: TypedRouteHandler<Body, Query>) =>
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
      middleware: (
        middleware: TypedRouteHandler<
          unknown,
          BaseQuery,
          BaseParams,
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
            ResponseBody,
            Status,
            ContentType,
            Outputs
          >
        ) => createOperation({ outputs, middleware, handler })
      }),
      handler: (
        handler: TypedRouteHandler<
          unknown,
          BaseQuery,
          BaseParams,
          ResponseBody,
          Status,
          ContentType,
          Outputs
        >
      ) => createOperation({ outputs, handler })
    }),
    middleware: (middleware: TypedRouteHandler) => ({
      handler: (handler: TypedRouteHandler) =>
        createOperation({ middleware, handler })
    }),
    handler: (handler: TypedRouteHandler) => createOperation({ handler })
  };
};
