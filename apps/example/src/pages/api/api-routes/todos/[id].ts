import { apiRouteHandler, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

const TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
];

// Example dynamic Pages Router API route with GET/DELETE handlers.
export default apiRouteHandler({
  GET: apiRouteOperation({
    operationId: 'getTodoById',
    tags: ['example-api', 'todos', 'pages-router']
  })
    .input({
      query: z.object({
        id: z.string()
      })
    })
    .outputs([
      {
        schema: z.object({
          id: z.number(),
          name: z.string(),
          completed: z.boolean()
        }),
        status: 200,
        contentType: 'application/json'
      },
      {
        schema: z.string(),
        status: 404,
        contentType: 'application/json'
      }
    ])
    .handler((req, res) => {
      const todo = TODOS.find((t) => t.id === Number(req.query.id));

      if (!todo) {
        res.status(404).json('TODO not found.');
        return;
      }

      res.status(200).json(todo);
    }),

  DELETE: apiRouteOperation({
    operationId: 'deleteTodo',
    tags: ['example-api', 'todos', 'pages-router']
  })
    .input({
      query: z.object({
        id: z.string()
      })
    })
    .outputs([
      {
        schema: z.string(),
        status: 204,
        contentType: 'application/json'
      },
      {
        schema: z.string(),
        status: 404,
        contentType: 'application/json'
      }
    ])
    .handler((req, res) => {
      // Delete todo.
      const todo = TODOS.find((t) => t.id === Number(req.query.id));

      if (!todo) {
        res.status(404).json('TODO not found.');
      }

      res.status(204).json('TODO deleted.');
    })
});
