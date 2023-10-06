/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { type TypedNextApiResponse, type TypedNextResponse } from './response';
import { type TypedNextApiRequest, type TypedNextRequest } from './request';

export type RouteHandler<
  Body = unknown,
  Query = unknown,
  ResponseBody = unknown
> = (
  req: TypedNextRequest<Body, Query>,
  context: { params: Record<string, unknown> }
) =>
  | Promise<TypedNextResponse<ResponseBody> | void>
  | TypedNextResponse<ResponseBody>
  | void;

export type ApiRouteHandler<
  Body = unknown,
  Query = unknown,
  ResponseBody = unknown
> = (
  req: TypedNextApiRequest<Body, Query>,
  res: TypedNextApiResponse<ResponseBody>
) => Promise<void> | void;
