import { type NextApiRequest } from 'next/types';
import { type ValidMethod } from '../constants';
import { type Modify } from './utility-types';
import { type NextRequest } from 'next/server';

export type TypedNextRequest<Body> = Modify<
  NextRequest,
  {
    json: () => Promise<Body>;
    method: ValidMethod;
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
