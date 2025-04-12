import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { MOCK_TODOS, todoSchema } from '@/utils';
import { z } from 'zod';

export const runtime = 'edge';

export const { GET, POST } = route({
  getTodos: routeOperation({
    method: 'GET'
  })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: z.array(todoSchema).describe('List of TODOs.')
      }
    ])
    .handler(() => {
      return TypedNextResponse.json(MOCK_TODOS, {
        status: 200
      });
    }),

  createTodo: routeOperation({
    method: 'POST'
  })
    .input({
      contentType: 'application/json',
      body: z
        .object({
          name: z.string()
        })
        .describe("New TODO's name.")
    })
    .outputs([
      {
        status: 201,
        contentType: 'application/json',
        body: z.string().describe('New TODO created message.')
      },
      {
        status: 401,
        contentType: 'application/json',
        body: z.string().describe('Unauthorized.')
      }
    ])
    // Optional middleware logic executed before request validation.
    .middleware((req) => {
      if (!req.headers.get('very-secure')) {
        return TypedNextResponse.json('Unauthorized.', {
          status: 401
        });
      }
    })
    .handler(async (req) => {
      const { name } = await req.json();

      return TypedNextResponse.json(`New TODO created: ${name}`, {
        status: 201
      });
    })
});
