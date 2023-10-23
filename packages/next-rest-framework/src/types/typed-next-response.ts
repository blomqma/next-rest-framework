import { type I18NConfig } from 'next/dist/server/config-shared';
import { type ResponseCookies } from 'next/dist/server/web/spec-extension/cookies';
import { type BaseStatus } from './route-handlers';
import { type NextURL } from 'next/dist/server/web/next-url';

interface TypedResponseInit<Status extends BaseStatus>
  extends globalThis.ResponseInit {
  nextConfig?: {
    basePath?: string;
    i18n?: I18NConfig;
    trailingSlash?: boolean;
  };
  url?: string;
  status?: Status;
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

// A patched `NextResponse` that allows to strongly-typed status codes.
export declare class TypedNextResponse<
  Body,
  Status extends BaseStatus
> extends Response {
  [INTERNALS]: {
    cookies: ResponseCookies;
    url?: NextURL;
    body?: Body;
    status?: Status;
  };

  constructor(body?: BodyInit | null, init?: TypedResponseInit<Status>);

  get cookies(): ResponseCookies;

  static json<JsonBody, StatusCode extends BaseStatus>(
    body: JsonBody,
    init?: TypedResponseInit<StatusCode>
  ): TypedNextResponse<JsonBody, StatusCode>;

  static redirect<StatusCode extends BaseStatus>(
    url: string | NextURL | URL,
    init?: number | TypedResponseInit<StatusCode>
  ): TypedNextResponse<unknown, StatusCode>;

  static rewrite<StatusCode extends BaseStatus>(
    destination: string | NextURL | URL,
    init?: TypedMiddlewareResponseInit<StatusCode>
  ): TypedNextResponse<unknown, StatusCode>;

  static next<StatusCode extends BaseStatus>(
    init?: TypedMiddlewareResponseInit<StatusCode>
  ): TypedNextResponse<unknown, StatusCode>;
}
