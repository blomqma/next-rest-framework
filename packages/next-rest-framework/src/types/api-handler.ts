import { TypedNextApiRequest } from './request';
import { TypedNextApiResponse } from './response';

export type ApiHandler<
  Body,
  Params,
  Status,
  ContentType,
  Response,
  GlobalMiddlewareResponse,
  RouteMiddlewareResponse,
  MethodMiddlewareResponse
> = (params: {
  req: TypedNextApiRequest<Body, Params>;
  res: TypedNextApiResponse<Status, ContentType, Response>;
  params:
    | Record<string, never>
    | (Awaited<GlobalMiddlewareResponse> &
        Awaited<RouteMiddlewareResponse> &
        Awaited<MethodMiddlewareResponse>);
}) => Promise<void> | void;
