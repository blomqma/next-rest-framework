import { apiRouteHandler, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

const TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
];

// Example Pages Router API route with GET/POST handlers.
export default apiRouteHandler({
  GET: apiRouteOperation({
    operationId: 'getTodos',
    tags: ['example-api', 'todos', 'pages-router']
  })
    .output([
      {
        status: 200,
        contentType: 'application/json',
        schema: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            completed: z.boolean()
          })
        )
      }
    ])
    .handler((req, res) => {
      res.status(200).json(TODOS);
    }),

  POST: apiRouteOperation({
    operationId: 'createTodo',
    tags: ['example-api', 'todos', 'pages-router']
  })
    .input({
      contentType: 'application/json',
      body: z.object({
        name: z.string()
      })
    })
    .output([
      {
        status: 201,
        contentType: 'application/json',
        schema: z.string()
      }
    ])
    .handler((req, res) => {
      const { name } = req.body;
      console.log('Strongly typed TODO name: ', name);
      res.status(201).json('New TODO created.');
    })
});
