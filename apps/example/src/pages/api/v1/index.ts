import { docsApiRoute } from 'next-rest-framework';

export default docsApiRoute({
  deniedPaths: ['/api/routes/third-party-endpoint'],
  openApiJsonPath: '/openapi.json',
  docsConfig: {
    provider: 'swagger-ui'
  }
});
