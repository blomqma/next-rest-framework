import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

export const runtime = 'edge';

const schema = z.object({
  foo: z.string().uuid(),
  bar: z.string().optional(),
  baz: z.string()
});

// Example pages router API route handler with query params.
export default apiRoute({
  getQueryParams: apiRouteOperation({
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
    .handler((req, res) => {
      res.json(req.query);
    })
});
