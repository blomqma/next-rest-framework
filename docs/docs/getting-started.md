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

This is enough to get you started. Now you can access the API documentation in your browser. Calling this endpoint will automatically generate the `openapi.json` OpenAPI specification file, located in the `public` folder by default. You can also configure this endpoint to disable the automatic generation of the OpenAPI spec file or use the CLI command `npx next-rest-framework generate` to generate it. You can also create multiple docs endpoints for various use cases. See the full configuration options of this endpoint in the [Docs handler](/docs/api-reference#docs-handler-options) section.

### [Create endpoint](#create-endpoint)

#### App Router:

```typescript
// src/app/api/todos/route.ts

import { routeHandler, routeOperation } from 'next-rest-framework';
import { NextResponse } from 'next/server';
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
    operationId: 'getTodos',
    tags: ['example-api', 'todos', 'app-router']
  })
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
      return NextResponse.json(TODOS, {
        status: 200
      });
    }),

  POST: routeOperation({
    operationId: 'createTodo',
    tags: ['example-api', 'todos', 'app-router']
  })
    .input({
      contentType: 'application/json',
      body: z.object({
        name: z.string()
      })
    })
    .output([
      {
        status: 201,
        contentType: 'application/json',
        schema: z.string()
      }
    ])
    .handler(async (req) => {
      const { name } = await req.json();
      console.log('Strongly typed TODO name: ', name);

      return NextResponse.json('New TODO created.', {
        status: 201
      });
    })
});

export { handler as GET, handler as POST };
```

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
    operationId: 'getTodos',
    tags: ['example-api', 'todos', 'pages-router']
  })
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
    .handler((req, res) => {
      res.status(200).json(TODOS);
    }),

  POST: apiRouteOperation({
    operationId: 'createTodo',
    tags: ['example-api', 'todos', 'pages-router']
  })
    .input({
      contentType: 'application/json',
      body: z.object({
        name: z.string()
      })
    })
    .output([
      {
        status: 201,
        contentType: 'application/json',
        schema: z.string()
      }
    ])
    .handler((req, res) => {
      const { name } = req.body;
      console.log('Strongly typed TODO name: ', name);
      res.status(201).json('New TODO created.');
    })
});
```

These type-safe endpoints will be now auto-generated to your OpenAPI spec:

![Next REST Framework docs](@site/static/img/docs-screenshot.jpg)
