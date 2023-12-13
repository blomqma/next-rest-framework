import { docsApiRoute, apiRoute, rpcApiRoute } from './pages-router';
import { docsRoute, route, rpcRoute } from './app-router';

/**
 * @deprecated: Use `docsRoute` instead.
 */
export const docsRouteHandler = docsRoute;

/**
 * @deprecated: Use `route` instead.
 */
export const routeHandler = route;

/**
 * @deprecated: Use `rpcRoute` instead.
 */
export const rpcRouteHandler = rpcRoute;

/**
 * @deprecated: Use `apiRoute` instead.
 */
export const apiRouteHandler = apiRoute;

/**
 * @deprecated: Use `docsApiRoute` instead.
 */
export const docsApiRouteHandler = docsApiRoute;

/**
 * @deprecated: Use `rpcApiRoute` instead.
 */
export const rpcApiRouteHandler = rpcApiRoute;
