import { apiRouteHandler, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

const TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
];

// Example Pages Router API route with GET/POST handlers.
export default apiRouteHandler({
  GET: apiRouteOperation({
    // Optional OpenAPI operation documentation.
    operationId: 'getTodos',
    tags: ['example-api', 'todos', 'pages-router']
  })
    // Output schema for strictly-typed responses and OpenAPI documentation.
    .output([
      {
        status: 200,
        contentType: 'application/json',
        schema: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            completed: z.boolean()
          })
        )
      }
    ])
    .handler((_req, res) => {
      // Type-checked response.
      res.status(200).json(TODOS);
    }),

  POST: apiRouteOperation({
    // Optional OpenAPI operation documentation.
    operationId: 'createTodo',
    tags: ['example-api', 'todos', 'pages-router']
  })
    // Input schema for strictly-typed request, request validation and OpenAPI documentation.
    .input({
      contentType: 'application/json',
      body: z.object({
        name: z.string()
      })
    })
    // Output schema for strictly-typed responses and OpenAPI documentation.
    .output([
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
    // Optional middleware logic executed before request validation.
    .middleware((req, res) => {
      if (!req.headers.authorization) {
        res.status(401).json('Unauthorized'); // Type-checked response.
      }
    })
    .handler((req, res) => {
      const { name } = req.body; // Strictly-typed request.
      res.status(201).json(`New TODO created: ${name}`); // Type-checked response.
    })
});
