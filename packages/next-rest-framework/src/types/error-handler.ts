import { NextApiRequest, NextApiResponse } from 'next';

export type ErrorHandler<
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
