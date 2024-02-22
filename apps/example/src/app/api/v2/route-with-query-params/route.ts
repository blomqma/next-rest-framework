import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

export const runtime = 'edge';

const schema = z.object({
  foo: z.string().uuid(),
  bar: z.string().optional(),
  baz: z.string()
});

// Example app router route handler with query params.
export const { GET } = route({
  getQueryParams: routeOperation({
    method: 'GET'
  })
    .input({
      contentType: 'application/json',
      query: schema
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        schema
      }
    ])
    .handler((req) => {
      const query = req.nextUrl.searchParams;

      return TypedNextResponse.json({
        foo: query.get('foo') ?? '',
        bar: query.get('bar') ?? '',
        baz: query.get('baz') ?? ''
      });
    })
});
