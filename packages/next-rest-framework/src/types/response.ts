import { type NextResponse } from 'next/server';
import { type NextApiResponse } from 'next/types';

export type TypedNextResponse<Body> = NextResponse<Body>;

export type TypedNextApiResponse<Body> = NextApiResponse<Body>;
