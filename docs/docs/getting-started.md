---
sidebar_position: 2
---

# Getting started

### [Installation](#installation)

```
npm install --save next-rest-framework
```

### [Create docs handler](#create-docs-handler)

To get access to the auto-generated documentation, initialize the docs endpoint somewhere in your codebase. You can also skip this step if you don't want to expose a public API documentation.

#### App Router:

```typescript
// src/app/api/route.ts

import { docsRouteHandler } from 'next-rest-framework';

export const GET = docsRouteHandler();
```

#### Pages Router:

```typescript
// src/pages/api.ts

import { docsApiRouteHandler } from 'next-rest-framework';

export default docsApiRouteHandler();
```

This is enough to get you started. Now you can access the API documentation in your browser. Calling this endpoint will automatically generate the `openapi.json` OpenAPI specification file, located in the `public` folder by default. You can also configure this endpoint to disable the automatic generation of the OpenAPI spec file or use the CLI command `npx next-rest-framework generate` to generate it. You can also create multiple docs endpoints for various use cases. See the full configuration options of this endpoint in the [Docs handler options](/docs/api-reference#docs-handler-options) section.

### [Create endpoint](#create-endpoint)

#### App Router:

```typescript
// src/app/api/todos/route.ts

import {
  TypedNextResponse,
  routeHandler,
  routeOperation
} from 'next-rest-framework';
import { z } from 'zod';

const TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
];

// Example App Router route handler with GET/POST handlers.
const handler = routeHandler({
  GET: routeOperation({
    // Optional OpenAPI operation documentation.
    operationId: 'getTodos',
    tags: ['example-api', 'todos', 'app-router']
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
    .handler(() => {
      // Type-checked response.
      return TypedNextResponse.json(TODOS, {
        status: 200
      });
    }),

  POST: routeOperation({
    // Optional OpenAPI operation documentation.
    operationId: 'createTodo',
    tags: ['example-api', 'todos', 'app-router']
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
    .middleware((req) => {
      if (!req.headers.get('authorization')) {
        // Type-checked response.
        return TypedNextResponse.json('Unauthorized', {
          status: 401
        });
      }
    })
    .handler(async (req) => {
      const { name } = await req.json(); // Strictly-typed request.

      // Type-checked response.
      return TypedNextResponse.json(`New TODO created: ${name}`, {
        status: 201
      });
    })
});

export { handler as GET, handler as POST };
```

The `TypedNextResponse` ensures that the response status codes and content-type headers are type-checked. You can still use the regular `NextResponse` if you prefer to have less type-safety.

#### Pages Router:

```typescript
// src/pages/api/todos.ts

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
```

These type-safe endpoints will be now auto-generated to your OpenAPI spec:

![Next REST Framework docs](@site/static/img/docs-screenshot.jpg)
