import { MOCK_TODOS, todoSchema } from '@/utils';
import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

export const runtime = 'edge';

export const { GET, DELETE } = route({
  getTodoById: routeOperation({
    method: 'GET'
  })
    .outputs([
      {
        body: todoSchema,
        status: 200,
        contentType: 'application/json'
      },
      {
        body: z.string(),
        status: 404,
        contentType: 'application/json'
      }
    ])
    .handler((_req, { params: { id } }) => {
      const todo = MOCK_TODOS.find((t) => t.id === Number(id));

      if (!todo) {
        return TypedNextResponse.json('TODO not found.', {
          status: 404
        });
      }

      return TypedNextResponse.json(todo, {
        status: 200
      });
    }),

  deleteTodo: routeOperation({
    method: 'DELETE'
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
    .handler((_req, { params: { id } }) => {
      const todo = MOCK_TODOS.find((t) => t.id === Number(id));

      if (!todo) {
        return TypedNextResponse.json('TODO not found.', {
          status: 404
        });
      }

      // Delete todo.

      return TypedNextResponse.json('TODO deleted.', {
        status: 204
      });
    })
});
