import { docsRoute } from 'next-rest-framework';

export const runtime = 'edge';

export const { GET } = docsRoute({
  deniedPaths: ['/api/v2/third-party-endpoint', '/api/v1/third-party-endpoint']
});
