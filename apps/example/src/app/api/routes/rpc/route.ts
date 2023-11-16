import { rpcOperation, rpcRouteHandler } from 'next-rest-framework';
import { z } from 'zod';

const TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
];

// Example App Router RPC handler.
export const POST = rpcRouteHandler({
  getTodos: rpcOperation({
    // Optional OpenAPI operation documentation.
    operationId: 'getTodos',
    tags: ['example-api', 'todos', 'app-router', 'rpc']
  })
    // Output schema for strictly-typed responses and OpenAPI documentation.
    .output([
      z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          completed: z.boolean()
        })
      )
    ])
    .handler(() => {
      // Type-checked response.
      return TODOS;
    }),

  getTodoById: rpcOperation({
    operationId: 'getTodoById',
    tags: ['example-api', 'todos', 'app-router', 'rpc']
  })
    .input(z.string())
    .output([
      z.object({
        error: z.string()
      }),
      z.object({
        id: z.number(),
        name: z.string(),
        completed: z.boolean()
      })
    ])
    .handler((id) => {
      const todo = TODOS.find((t) => t.id === Number(id));

      if (!todo) {
        // Type-checked response.
        return { error: 'TODO not found.' };
      }

      // Type-checked response.
      return todo;
    }),

  createTodo: rpcOperation({
    // Optional OpenAPI operation documentation.
    operationId: 'createTodo',
    tags: ['example-api', 'todos', 'app-router', 'rpc']
  })
    // Input schema for strictly-typed request, request validation and OpenAPI documentation.
    .input(
      z.object({
        name: z.string()
      })
    )
    // Output schema for strictly-typed responses and OpenAPI documentation.
    .output([z.object({ message: z.string() })])
    .handler(async ({ name }) => {
      // Type-checked response.
      return { message: `New TODO created: ${name}` };
    }),

  deleteTodo: rpcOperation({
    operationId: 'deleteTodo',
    tags: ['example-api', 'todos', 'app-router', 'rpc']
  })
    .input(z.string())
    .output([
      z.object({ error: z.string() }),
      z.object({ message: z.string() })
    ])
    .handler((id) => {
      // Delete todo.
      const todo = TODOS.find((t) => t.id === Number(id));

      if (!todo) {
        // Type-checked response.
        return {
          error: 'TODO not found.'
        };
      }

      // Type-checked response.
      return { message: 'TODO deleted.' };
    })
});

export type AppRouterRpcClient = typeof POST.client;
