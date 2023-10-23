import { docsApiRouteHandler } from 'next-rest-framework';

export default docsApiRouteHandler({
  deniedPaths: ['/api/routes/third-party-endpoint'],
  openApiJsonPath: '/openapi.json',
  docsConfig: {
    provider: 'swagger-ui'
  }
});
