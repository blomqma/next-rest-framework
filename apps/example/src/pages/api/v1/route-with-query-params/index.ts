import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

const querySchema = z.object({
  foo: z.string().uuid(),
  bar: z.string().optional(),
  baz: z.string()
});

export default apiRoute({
  getQueryParams: apiRouteOperation({
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
    .handler((req, res) => {
      res.json(req.query);
    })
});
