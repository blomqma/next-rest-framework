---
sidebar_position: 2
---

# Getting started

### [Installation](#installation)

```
npm install next-rest-framework
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

This is enough to get you started. Now you can access the API documentation in your browser. Calling this endpoint will automatically generate the `openapi.json` OpenAPI specification file, located in the `public` folder by default. You can also configure this endpoint to disable the automatic generation of the OpenAPI spec file or use the [CLI](#cli) command `npx next-rest-framework generate` to generate it. You can also create multiple docs endpoints for various use cases. See the full configuration options of this endpoint in the [Docs handler options](#docs-handler-options) section.

### [Create endpoint](#create-endpoint)

#### REST

##### App Router:

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
    .outputs([
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

##### Pages Router:

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
    .outputs([
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

#### [RPC](#rpc)

You can also define your APIs with RPC route handlers that also auto-generates the OpenAPI spec and provides a type-safe API client for end-to-end type safety.

##### App Router:

```typescript
// src/app/api/rpc/route.ts

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
```

##### Pages Router:

```typescript
// src/pages/api/rpc.ts

import { rpcApiRouteHandler } from 'next-rest-framework';

// Example Pages Router RPC handler.
const handler = rpcApiRouteHandler({
  // ...
  // Exactly the same as the App Router example.
});

export default handler;

export type RpcApiRouteClient = typeof handler.client;
```

You can also use the `rpcOperation` function outside the `rpcRouteHandler` function and call it server-side anywhere in your code, just like you would call a Next.js [Server Action](https://nextjs.org/docs/app/api-reference/functions/server-actions).

##### Client

```typescript
import { rpcClient } from 'next-rest-framework/client';
import { type AppRouterRpcClient } from 'app/api/routes/rpc/route';

// Works both on server and client.
const client = rpcClient<AppRouterRpcClient>({
  url: 'http://localhost:3000/api/routes/rpc'
});

// Simple example - the client can be easily integrated with any data fetching framework, like React Query or RTKQ.
export default async function Page() {
  const data = await client.getTodos();
  // ...
}
```

All of above type-safe endpoints will be now auto-generated to your OpenAPI spec and exposed in the documentation:

![Next REST Framework docs](@site/static/img/docs-screenshot.jpg)
