import { docsRoute } from 'next-rest-framework';

export const { GET } = docsRoute({
  deniedPaths: ['/api/routes/third-party-endpoint'],
  openApiJsonPath: '/openapi.json'
});
