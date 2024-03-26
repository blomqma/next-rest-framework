import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

const paramsSchema = z.object({
  slug: z.enum(['foo', 'bar', 'baz'])
});

export default apiRoute({
  getQueryParams: apiRouteOperation({
    method: 'GET'
  })
    .input({
      contentType: 'application/json',
      query: paramsSchema
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: paramsSchema
      }
    ])
    .handler((req, res) => {
      res.json(req.query);
    })
});
