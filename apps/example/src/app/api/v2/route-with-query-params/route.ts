import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

const querySchema = z.object({
  total: z.string()
});

export const runtime = 'edge';

export const { GET } = route({
  getQueryParams: routeOperation({
    method: 'GET'
  })
    .input({
      contentType: 'application/json',
      query: querySchema
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: querySchema
      }
    ])
    .handler((req) => {
      const query = req.nextUrl.searchParams;

      return TypedNextResponse.json({
        total: query.get('total') ?? ''
      });
    })
});
