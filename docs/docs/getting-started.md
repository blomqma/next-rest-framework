---
sidebar_position: 2
---

# Getting started

## Requirements

In order to use Next REST Framework you need to have a Next.js project with the following dependencies installed:

- [Next.js](https://github.com/vercel/next.js) >= v12
- [Zod](https://github.com/colinhacks/zod) >= v3
- [TypeScript](https://www.typescriptlang.org/) >= v3

## [Installation](#installation)

```sh
npm install next-rest-framework
```

### [Create docs endpoint](#create-docs-endpoint)

To get access to the auto-generated documentation, initialize the docs endpoint somewhere in your codebase. You can also skip this step if you don't want to expose a public API documentation.

#### [App router docs route](#app-router-docs-route):

```typescript
// src/app/api/route.ts

import { docsRoute } from 'next-rest-framework';

export const { GET } = docsRoute();
```

#### [Pages router docs API route](#pages-router-docs-api-route):

```typescript
// src/pages/api.ts

import { docsApiRoute } from 'next-rest-framework';

export default docsApiRoute();
```

This is enough to get you started. Now you can access the API documentation in your browser. Running `npx next-rest-framework generate` in the project root will generate the `openapi.json` OpenAPI specification file, located in the `public` folder. You can create multiple docs endpoints if needed and specify which config to use for the [CLI](#cli). See the full configuration options of this endpoint in the [Docs handler options](#docs-handler-options) section.

### [Create endpoint](#create-endpoint)

#### [REST endpoints](#rest-endpoints)

##### [App router route](#app-router-route):

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

##### [Pages router API route](#pages-router-api-route):

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

After running `next-rest-framework generate`, all of above type-safe endpoints will be auto-generated to your OpenAPI spec and exposed in the documentation:

![Next REST Framework docs](@site/static/img/docs-screenshot.jpg)

#### [RPC endpoints](#rpc-endpoints)

##### [App router RPC route](#app-router-rpc-route):

A recommended way is to write your RPC operation in a separate server-side module where they can be consumed both by the RPC endpoints and directly as server-side functions (server actions):

```typescript
// src/app/actions.ts

'use server';

import { rpcOperation } from 'next-rest-framework';
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

export const getTodos = rpcOperation({
  tags: ['RPC']
})
  .outputs([
    {
      schema: z.array(todoSchema)
    }
  ])
  .handler(() => {
    return TODOS; // Type-checked output.
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
    const todo = TODOS.find((t) => t.id === Number(id));

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
    const todo = TODOS.find((t) => t.id === Number(id));

    if (!todo) {
      return {
        error: 'TODO not found.' // Type-checked output.
      };
    }

    return { message: 'TODO deleted.' }; // Type-checked output.
  });
```

The file path to and RPC route must end with `/[operationId]/route.ts`. Import the RPC operations in to your RPC route handler:

```typescript
// src/app/api/rpc/[operationId]/route.ts

import { createTodo, deleteTodo, getTodoById, getTodos } from 'src/app/actions';
import { rpcRoute } from 'next-rest-framework';

export const { POST } = rpcRoute({
  getTodos,
  getTodoById,
  createTodo,
  deleteTodo
});

export type RpcClient = typeof POST.client;
```

Consume the RPC operations directly in your server-side components:

```typescript
'use server';

import { getTodos, createTodo } from 'src/app/actions';

export default async function Page() {
  const todos = await getTodos();

  const createTodo = async (name: string) => {
    'use server';
    return createTodo({ name });
  };

  // ...
}
```

##### [Pages router RPC route](#pages-router-rpc-api-route):

The filename of an RPC API route must be `[operationId].ts`.

```typescript
// src/pages/api/rpc/[operationId].ts

import { rpcApiRoute } from 'next-rest-framework';

// Example pages router RPC handler.
const handler = rpcApiRoute({
  // ...
  // Exactly the same as the app router example. You can also inline the RPC operations in this object.
});

export default handler;

export type RpcClient = typeof handler.client;
```

The RPC routes will also be included in your OpenAPI spec after running `next-rest-framework generate`.

### [Client](#client)

#### [REST client](#rest-client)

To achieve end-to-end type-safety, you can use any client implementation that relies on the generated OpenAPI specification, e.g. [openapi-client-axios](https://github.com/openapistack/openapi-client-axios).

#### [RPC client](#rpc-client)

For client-rendered components you can use the strongly-typed `rpcClient`:

```typescript
'use client';

import { rpcClient } from 'next-rest-framework/rpc-client';
import { type RpcClient } from 'app/api/rpc/[operationId]';

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
    const todo = client.createTodo({ name });
    // ...
  };

  // ...
}
```

The `rpcClient` calls can also be easily integrated with any data fetching framework, like React Query or RTKQ.
