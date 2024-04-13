import { MOCK_TODOS, todoSchema } from '@/utils';
import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

const paramsSchema = z
  .object({
    id: z.string()
  })
  .describe('TODO ID path parameter.');

export default apiRoute({
  getTodoById: apiRouteOperation({
    method: 'GET'
  })
    .input({
      params: paramsSchema
    })
    .outputs([
      {
        body: todoSchema.describe('TODO response.'),
        status: 200,
        contentType: 'application/json'
      },
      {
        body: z.string().describe('TODO not found.'),
        status: 404,
        contentType: 'application/json'
      }
    ])
    .handler((req, res) => {
      const todo = MOCK_TODOS.find((t) => t.id === Number(req.query.id));

      if (!todo) {
        res.status(404).json('TODO not found.');
        return;
      }

      res.status(200).json(todo);
    }),

  deleteTodo: apiRouteOperation({
    method: 'DELETE'
  })
    .input({
      params: paramsSchema
    })
    .outputs([
      {
        body: z.string(),
        status: 204,
        contentType: 'application/json'
      },
      {
        body: z.string(),
        status: 404,
        contentType: 'application/json'
      }
    ])
    .handler((req, res) => {
      const todo = MOCK_TODOS.find((t) => t.id === Number(req.query.id));

      if (!todo) {
        res.status(404).json('TODO not found.');
      }

      // Delete the todo.
      res.status(204).json('TODO deleted.');
    })
});
