import { docsRouteHandler } from 'next-rest-framework';

export const GET = docsRouteHandler({
  deniedPaths: ['/api/*/some-api'],
  openApiJsonPath: '/openapi.json'
});
