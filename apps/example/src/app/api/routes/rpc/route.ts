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
  getTodos: rpcOperation()
    // Output schema for strictly-typed responses and OpenAPI documentation.
    .outputs([
      {
        schema: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            completed: z.boolean()
          })
        )
      }
    ])
    .handler(() => {
      // Type-checked response.
      return TODOS;
    }),

  getTodoById: rpcOperation()
    .input(z.string())
    .outputs([
      {
        schema: z.object({
          error: z.string()
        })
      },
      {
        schema: z.object({
          id: z.number(),
          name: z.string(),
          completed: z.boolean()
        })
      }
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

  createTodo: rpcOperation()
    // Input schema for strictly-typed request, request validation and OpenAPI documentation.
    .input(
      z.object({
        name: z.string()
      })
    )
    // Output schema for strictly-typed responses and OpenAPI documentation.
    .outputs([{ schema: z.object({ message: z.string() }) }])
    .handler(async ({ name }) => {
      // Type-checked response.
      return { message: `New TODO created: ${name}` };
    }),

  deleteTodo: rpcOperation()
    .input(z.string())
    .outputs([
      { schema: z.object({ error: z.string() }) },
      { schema: z.object({ message: z.string() }) }
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
