import { NextApiRequest, NextApiResponse } from 'next';

export type Middleware<
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
