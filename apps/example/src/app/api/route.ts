import { docsRouteHandler } from 'next-rest-framework';

export const GET = docsRouteHandler({
  deniedPaths: ['/api/routes/third-party-endpoint'],
  openApiJsonPath: '/openapi.json'
});
