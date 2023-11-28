import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { MOCK_TODOS, todoSchema } from 'utils';
import { z } from 'zod';

// Example App Router route handler with GET/POST handlers.
const { GET, POST } = route({
  getTodos: routeOperation({
    method: 'GET',
    // Optional OpenAPI operation documentation.
    openApiOperation: {
      tags: ['example-api', 'todos', 'app-router']
    }
  })
    // Output schema for strictly-typed responses and OpenAPI documentation.
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        schema: z.array(todoSchema)
      }
    ])
    .handler(() => {
      // Type-checked response.
      return TypedNextResponse.json(MOCK_TODOS, {
        status: 200
      });
    }),

  createTodo: routeOperation({
    method: 'POST',
    // Optional OpenAPI operation documentation.
    openApiOperation: {
      tags: ['example-api', 'todos', 'app-router']
    }
  })
    // Input schema for strictly-typed request, request validation and OpenAPI documentation.
    .input({
      contentType: 'application/json',
      body: z.object({
        name: z.string()
      })
    })
    // Output schema for strictly-typed responses and OpenAPI documentation.
    .outputs([
      {
        status: 201,
        contentType: 'application/json',
        schema: z.string()
      },
      {
        status: 401,
        contentType: 'application/json',
        schema: z.string()
      }
    ])
    .middleware(
      // Optional middleware logic executed before request validation.
      (req) => {
        if (!req.headers.get('authorization')) {
          // Type-checked response.
          return TypedNextResponse.json('Unauthorized', {
            status: 401
          });
        }
      }
    )
    .handler(async (req) => {
      const { name } = await req.json(); // Strictly-typed request.

      // Type-checked response.
      return TypedNextResponse.json(`New TODO created: ${name}`, {
        status: 201
      });
    })
});

export { GET, POST };
