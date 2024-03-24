import { MOCK_TODOS, todoSchema } from '@/utils';
import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

export default apiRoute({
  getTodos: apiRouteOperation({
    method: 'GET'
  })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: z.array(todoSchema)
      }
    ])
    .handler((_req, res) => {
      res.status(200).json(MOCK_TODOS);
    }),

  createTodo: apiRouteOperation({
    method: 'POST'
  })
    .input({
      contentType: 'application/json',
      body: z.object({
        name: z.string()
      })
    })
    .outputs([
      {
        status: 201,
        contentType: 'application/json',
        body: z.string()
      },
      {
        status: 401,
        contentType: 'application/json',
        body: z.string()
      }
    ])
    // Optional middleware logic executed before request validation.
    .middleware((req, res) => {
      if (!req.headers['very-secure']) {
        res.status(401).json('Unauthorized');
      }
    })
    .handler((req, res) => {
      const { name } = req.body;
      // Create a new TODO.
      res.status(201).json(`New TODO created: ${name}`);
    })
});
