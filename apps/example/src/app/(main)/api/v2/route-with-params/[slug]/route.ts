import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

const paramsSchema = z.object({
  slug: z.enum(['foo', 'bar', 'baz'])
});

const querySchema = z.object({
  total: z.string()
});

export const runtime = 'edge';

export const { GET } = route({
  getPathParams: routeOperation({
    method: 'GET'
  })
    .input({
      contentType: 'application/json',
      params: paramsSchema.describe('Path parameters input.'),
      query: querySchema.describe('Query parameters input.')
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: paramsSchema.merge(querySchema).describe('Parameters response.')
      }
    ])
    .handler((req, { params: { slug } }) => {
      const query = req.nextUrl.searchParams;

      return TypedNextResponse.json({
        slug,
        total: query.get('total') ?? ''
      });
    })
});
