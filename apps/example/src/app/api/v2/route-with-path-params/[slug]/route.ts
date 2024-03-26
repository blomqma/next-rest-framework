import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

const paramsSchema = z.object({
  slug: z.enum(['foo', 'bar', 'baz'])
});

export const runtime = 'edge';

export const { GET } = route({
  getPathParams: routeOperation({
    method: 'GET'
  })
    .input({
      contentType: 'application/json',
      params: paramsSchema
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: paramsSchema
      }
    ])
    .handler((_req, { params: { slug } }) => {
      return TypedNextResponse.json({
        slug
      });
    })
});
