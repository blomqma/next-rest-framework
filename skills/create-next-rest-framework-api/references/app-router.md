# App Router Patterns

Use these patterns for files under `src/app/**/route.ts`.

## Docs Endpoint (`docsRoute`)

```ts
// src/app/api/v2/route.ts
import { docsRoute } from 'next-rest-framework';

export const { GET } = docsRoute({
  deniedPaths: ['/api/v2/third-party-endpoint'],
  allowedPaths: ['/api/v2/**'],
  openApiObject: {
    info: { title: 'My API', version: '1.0.0' }
  },
  docsConfig: {
    provider: 'swagger-ui',
    title: 'My API Docs'
  }
});
```

## REST Route (`route` + `routeOperation`)

```ts
import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

const todoSchema = z.object({ id: z.number(), name: z.string() });

export const { GET, POST } = route(
  {
    getTodos: routeOperation({ method: 'GET' })
      .outputs([
        { status: 200, contentType: 'application/json', body: z.array(todoSchema) }
      ])
      .handler(() => TypedNextResponse.json([{ id: 1, name: 'A' }], { status: 200 })),

    createTodo: routeOperation({ method: 'POST' })
      .input({
        contentType: 'application/json',
        body: z.object({ name: z.string() })
      })
      .outputs([
        { status: 201, contentType: 'application/json', body: todoSchema },
        { status: 401, contentType: 'application/json', body: z.string() }
      ])
      .middleware((req) => {
        if (!req.headers.get('very-secure')) {
          return TypedNextResponse.json('Unauthorized', { status: 401 });
        }
      })
      .handler(async (req) => {
        const { name } = await req.json();
        return TypedNextResponse.json({ id: 2, name }, { status: 201 });
      })
  },
  {
    openApiPath: {
      summary: 'Todos endpoint',
      description: 'CRUD for TODO resources'
    }
  }
);
```

## RPC Route (`rpcRoute` + `rpcOperation`)

```ts
// src/app/api/rpc/[operationId]/route.ts
import { rpcRoute } from 'next-rest-framework';
import { getTodos, createTodo } from '@/actions';

export const { POST } = rpcRoute(
  {
    getTodos,
    createTodo
  },
  {
    openApiPath: { summary: 'RPC endpoint' }
  }
);

export type RpcClient = typeof POST.client;
```

Route filename must end in `/[operationId]/route.ts`.
