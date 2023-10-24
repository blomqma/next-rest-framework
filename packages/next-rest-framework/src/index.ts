import { NextResponse } from 'next/server';
import { type TypedNextResponse as TypedNextResponseType } from './types';
export {
  routeHandler,
  routeOperation,
  apiRouteHandler,
  apiRouteOperation
} from './route-handlers';
export { docsRouteHandler, docsApiRouteHandler } from './docs-handlers';

// @ts-expect-error - Keep the original NextResponse functionality with custom types.
export const TypedNextResponse: typeof TypedNextResponseType = NextResponse;
