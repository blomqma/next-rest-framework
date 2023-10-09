import { type NextApiRequest } from 'next/types';
import { type ValidMethod } from '../constants';
import { type Modify } from './utility-types';
import { type NextRequest } from 'next/server';
import { type NextURL } from 'next/dist/server/web/next-url';

export type TypedNextRequest<Body, Query> = Modify<
  NextRequest,
  {
    json: () => Promise<Body>;
    method: ValidMethod;
    nextUrl: NextURL & { search: Query };
  }
>;

export type TypedNextApiRequest<Body, Query> = Modify<
  NextApiRequest,
  {
    body: Body;
    query: Query;
    method: ValidMethod;
  }
>;
