import { docsApiRoute } from 'next-rest-framework';

export default docsApiRoute({
  deniedPaths: ['/api/v2/third-party-endpoint', '/api/v1/third-party-endpoint'], // Ignore endpoints from the generated OpenAPI spec.
  docsConfig: {
    provider: 'swagger-ui'
  }
});
