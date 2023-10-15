import { defineDocsRoute } from 'next-rest-framework';

export const GET = defineDocsRoute({
  deniedPaths: ['/api/*/some-api'],
  openApiJsonPath: '/openapi.json'
});
