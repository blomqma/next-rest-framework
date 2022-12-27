import { NextApiRequest } from 'next';
import { ValidMethod } from '../constants';
import { Modify } from './utility-types';

export type TypedNextApiRequest<Body = unknown> = Modify<
  NextApiRequest,
  {
    body: Body;
    method: ValidMethod;
  }
>;
