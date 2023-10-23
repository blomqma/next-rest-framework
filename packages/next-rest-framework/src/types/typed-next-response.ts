import { type I18NConfig } from 'next/dist/server/config-shared';
import { type ResponseCookies } from 'next/dist/server/web/spec-extension/cookies';
import { type BaseContentType, type BaseStatus } from './route-handlers';
import { type NextURL } from 'next/dist/server/web/next-url';
import { type Modify, type AnyCase } from './utility-types';

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
