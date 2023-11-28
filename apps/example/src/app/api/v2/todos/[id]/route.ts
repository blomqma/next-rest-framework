import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

const TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
];

// Example dynamic App Router route handler with GET/DELETE handlers.
export const { GET, DELETE } = route({
  getTodoById: routeOperation({
    method: 'GET',
    // Optional OpenAPI operation documentation.
    openApiOperation: {
      tags: ['example-api', 'todos', 'app-router']
    }
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
    .handler((_req, { params: { id } }) => {
      const todo = TODOS.find((t) => t.id === Number(id));

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
    method: 'DELETE',
    // Optional OpenAPI operation documentation.
    openApiOperation: {
      tags: ['example-api', 'todos', 'app-router']
    }
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
    .handler((_req, { params: { id } }) => {
      // Delete todo.
      const todo = TODOS.find((t) => t.id === Number(id));

      if (!todo) {
        return TypedNextResponse.json('TODO not found.', {
          status: 404
        });
      }

      return TypedNextResponse.json('TODO deleted.', {
        status: 204
      });
    })
});
