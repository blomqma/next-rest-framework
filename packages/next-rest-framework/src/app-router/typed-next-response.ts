import { NextResponse } from 'next/server';
import { type TypedNextResponse as TypedNextResponseType } from './route-operation';

// @ts-expect-error - Keep the original NextResponse functionality with custom types.
export const TypedNextResponse: typeof TypedNextResponseType = NextResponse;
