import { NextApiResponse } from 'next';
import { AnyCase, Modify } from './utility-types';

export type TypedNextApiResponse<Status, ContentType, Response> = Modify<
  Omit<NextApiResponse<Response>, 'send' | 'json'>,
  {
    status: (code: Status) => Omit<NextApiResponse<Response>, 'status'>;
    setHeader: <
      K extends AnyCase<'Content-Type'> | string,
      V extends number | string | readonly string[]
    >(
      name: K,
      value: K extends AnyCase<'Content-Type'> ? ContentType : V
    ) => void;
  }
>;
