'use server';

import { rpcOperation } from 'next-rest-framework';
import { MOCK_TODOS, todoSchema } from 'utils';
import { z } from 'zod';

// The RPC operations can be used as server-actions and imported in the RPC route handlers.

export const getTodos = rpcOperation({
  tags: ['RPC']
})
  .outputs([
    {
      schema: z.array(todoSchema)
    }
  ])
  .handler(() => {
    return MOCK_TODOS; // Type-checked output.
  });

export const getTodoById = rpcOperation({
  tags: ['RPC']
})
  .input(z.string())
  .outputs([
    {
      schema: z.object({
        error: z.string()
      })
    },
    {
      schema: todoSchema
    }
  ])
  .handler((id) => {
    const todo = MOCK_TODOS.find((t) => t.id === Number(id));

    if (!todo) {
      return { error: 'TODO not found.' }; // Type-checked output.
    }

    return todo; // Type-checked output.
  });

export const createTodo = rpcOperation({
  tags: ['RPC']
})
  .input(
    z.object({
      name: z.string()
    })
  )
  .outputs([{ schema: todoSchema }])
  .handler(
    async ({
      name // Strictly-typed input.
    }) => {
      // Create todo.
      const todo = { id: 2, name, completed: false };
      return todo; // Type-checked output.
    }
  );

export const deleteTodo = rpcOperation({
  tags: ['RPC']
})
  .input(z.string())
  .outputs([
    { schema: z.object({ error: z.string() }) },
    { schema: z.object({ message: z.string() }) }
  ])
  .handler((id) => {
    // Delete todo.
    const todo = MOCK_TODOS.find((t) => t.id === Number(id));

    if (!todo) {
      return {
        error: 'TODO not found.' // Type-checked output.
      };
    }

    return { message: 'TODO deleted.' }; // Type-checked output.
  });
