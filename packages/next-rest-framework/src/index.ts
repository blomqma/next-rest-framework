import { NextResponse } from 'next/server';
import { type TypedNextResponse as TypedNextResponseType } from './types';
export {
  docsApiRouteHandler,
  apiRouteHandler,
  apiRouteOperation
} from './pages-router';
export { docsRouteHandler, routeHandler, routeOperation } from './app-router';

// @ts-expect-error - Keep the original NextResponse functionality with custom types.
export const TypedNextResponse: typeof TypedNextResponseType = NextResponse;
