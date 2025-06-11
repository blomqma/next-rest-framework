'use server';

import { rpcOperation } from 'next-rest-framework';
import {
  MOCK_TODOS,
  formSchema,
  multipartFormSchema,
  todoSchema
} from '@/utils';
import { z } from 'zod';

// The RPC operations can be used as server-actions and imported in the RPC route handlers.

export const getTodos = rpcOperation()
  .outputs([
    {
      body: z.array(todoSchema).describe('List of TODOs.'),
      contentType: 'application/json'
    }
  ])
  .handler(async () => {
    return MOCK_TODOS;
  });

export const getTodoById = rpcOperation()
  .input({
    contentType: 'application/json',
    body: z.string().describe('TODO name.')
  })
  .outputs([
    {
      body: z
        .object({
          error: z.string()
        })
        .describe('TODO not found.'),
      contentType: 'application/json'
    },
    {
      body: todoSchema.describe('TODO response.'),
      contentType: 'application/json'
    }
  ])
  .handler(async (id) => {
    const todo = MOCK_TODOS.find((t) => t.id === Number(id));

    if (!todo) {
      return { error: 'TODO not found.' };
    }

    return todo;
  });

export const createTodo = rpcOperation()
  .input({
    contentType: 'application/json',
    body: z
      .object({
        name: z.string()
      })
      .describe("New TODO's name.")
  })
  .outputs([{ body: todoSchema, contentType: 'application/json' }])
  .handler(async ({ name }) => {
    const todo = { id: 4, name, completed: false };
    return todo;
  });

export const deleteTodo = rpcOperation()
  .input({
    contentType: 'application/json',
    body: z.string()
  })
  .outputs([
    {
      body: z.object({ error: z.string() }).describe('TODO not found.'),
      contentType: 'application/json'
    },
    {
      body: z.object({ message: z.string() }).describe('TODO deleted message.'),
      contentType: 'application/json'
    }
  ])
  .handler(async (id) => {
    const todo = MOCK_TODOS.find((t) => t.id === Number(id));

    if (!todo) {
      return {
        error: 'TODO not found.'
      };
    }

    return { message: 'TODO deleted.' };
  });

export const formDataUrlEncoded = rpcOperation()
  .input({
    contentType: 'application/x-www-form-urlencoded',
    body: formSchema.describe('Test form description.') // A zod-form-data schema is required.
  })
  .outputs([
    {
      body: formSchema.describe('Test form response.'),
      contentType: 'application/json'
    }
  ])
  .handler(async (formData) => {
    return {
      text: formData.get('text')
    };
  });

export const formDataMultipart = rpcOperation()
  .input({
    contentType: 'multipart/form-data',
    body: multipartFormSchema, // A zod-form-data schema is required.
    // The binary file cannot described with a Zod schema so we define it by hand for the OpenAPI spec.
    bodySchema: {
      description: 'Test form description.',
      type: 'object',
      properties: {
        text: {
          type: 'string'
        },
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  .outputs([
    {
      body: z.custom<File>(),
      // The binary file cannot described with a Zod schema so we define it by hand for the OpenAPI spec.
      bodySchema: {
        description: 'File response.',
        type: 'string',
        format: 'binary'
      },
      contentType: 'application/json'
    }
  ])
  .handler(async (formData) => {
    const file = formData.get('file');
    return file;
  });
