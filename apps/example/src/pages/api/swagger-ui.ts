import { docsApiRouteHandler } from 'next-rest-framework';

export default docsApiRouteHandler({
  deniedPaths: ['/api/*/some-api'],
  openApiJsonPath: '/openapi.json',
  docsConfig: {
    provider: 'swagger-ui'
  }
});
