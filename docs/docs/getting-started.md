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

#### App router:

```typescript
// src/app/api/route.ts

import { docsRoute } from 'next-rest-framework';

export const { GET } = docsRoute();
```

#### Pages router:

```typescript
// src/pages/api.ts

import { docsApiRoute } from 'next-rest-framework';

export default docsApiRoute();
```

This is enough to get you started. Now you can access the API documentation in your browser. Running `npx next-rest-framework generate` in the project root will generate the `openapi.json` OpenAPI specification file, located in the `public` folder by default. You can create multiple docs endpoints if needed and specify which config to use for the [CLI](#cli). See the full configuration options of this endpoint in the [Docs handler options](#docs-handler-options) section.

### [Create endpoint](#create-endpoint)

#### REST

##### App router:

```typescript
// src/app/api/todos/route.ts

import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

const TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
];

// Example app router route handler with GET/POST handlers.
export const { GET, POST } = route({
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
```

The `TypedNextResponse` ensures that the response status codes and content-type headers are type-checked. You can still use the regular `NextResponse` if you prefer to have less type-safety.

##### Pages router:

```typescript
// src/pages/api/todos.ts

import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

const TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
];

// Example pages router API route with GET/POST handlers.
export default apiRoute({
  getTodos: apiRouteOperation({
    method: 'GET',
    // Optional OpenAPI operation documentation.
    openApiOperation: {
      tags: ['example-api', 'todos', 'pages-router']
    }
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

  createTodo: apiRouteOperation({
    method: 'POST',
    // Optional OpenAPI operation documentation.
    openApiOperation: {
      tags: ['example-api', 'todos', 'pages-router']
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

All of above type-safe endpoints will be now auto-generated to your OpenAPI spec and exposed in the documentation:

![Next REST Framework docs](@site/static/img/docs-screenshot.jpg)

##### Client

To achieve end-to-end type-safety, you can use any client implementation that relies on the generated OpenAPI specification, e.g. [openapi-client-axios](https://github.com/openapistack/openapi-client-axios).

#### [RPC](#rpc)

You can also define your APIs with RPC route handlers that also auto-generate the OpenAPI spec. The RPC endpoints can be consumed with the type-safe API client for end-to-end type safety.

##### App router:

```typescript
// src/app/api/rpc/route.ts

import { rpcOperation, rpcRoute } from 'next-rest-framework';
import { z } from 'zod';

const TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
];

const todoSchema = z.object({
  id: z.number(),
  name: z.string(),
  completed: z.boolean()
});

// Example app router RPC handler.
const { POST, client } = rpcRoute({
  getTodos: rpcOperation()
    // Output schema for strictly-typed responses and OpenAPI documentation.
    .outputs([
      {
        schema: z.array(todoSchema)
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
        schema: todoSchema
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
    .outputs([{ schema: todoSchema }])
    .handler(async ({ name: _name }) => {
      // Create todo.
      const todo = { id: 2, name: _name, completed: false };

      // Type-checked response.
      return todo;
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

export { POST };

export type AppRouterRpcClient = typeof client;
```

##### Pages router:

```typescript
// src/pages/api/rpc.ts

import { rpcApiRoute } from 'next-rest-framework';

// Example pages router RPC handler.
const handler = rpcApiRoute({
  // ...
  // Exactly the same as the app router example.
});

export default handler;

export type RpcClient = typeof handler.client;
```

The RPC routes will also be included in your OpenAPI spec now. Note that the `rpcOperation` definitions can be also be placed outside the `rpcRouteHandler` if you do not want to expose them as public APIs as long as they're called server-side.

##### Client

The strongly-typed RPC operations can be called inside inside React server components and server actions like any functions:

```typescript
'use server';

import { client } from 'app/api/rpc/route';

export default async function Page() {
  const todos = await client.getTodos();

  const createTodo = async (name: string) => {
    'use server';
    return client.createTodo({ name });
  };

  // ...
}
```

For client-rendered components you can use the strongly-typed `rpcClient` or use server actions from the above example:

```typescript
'use client';

import { useState } from 'react';
import { rpcClient } from 'next-rest-framework/rpc-client';
import { type RpcClient } from 'app/api/rpc/route';

const client = rpcClient<RpcClient>({
  url: 'http://localhost:3000/api/rpc'
});

export default function Page() {
  // ...

  useEffect(() => {
    client
      .getTodos()
      .then(() => {
        // ...
      })
      .catch(console.error);
  }, []);

  const createTodo = async (name: string) => {
    'use server';
    return client.createTodo({ name });
  };

  // ...
}
```

The `rpcClient` calls can also be easily integrated with any data fetching framework, like React Query or RTKQ.
