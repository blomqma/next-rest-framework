# Pages Router Patterns

Use these patterns for files under `src/pages/api/**/*.ts`.

## Docs Endpoint (`docsApiRoute`)

```ts
// src/pages/api/v1/index.ts
import { docsApiRoute } from 'next-rest-framework';

export default docsApiRoute({
  deniedPaths: ['/api/v1/third-party-endpoint'],
  docsConfig: { provider: 'redoc', title: 'Public API' }
});
```

## REST Route (`apiRoute` + `apiRouteOperation`)

```ts
import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

const todoSchema = z.object({ id: z.number(), name: z.string() });

export default apiRoute(
  {
    getTodos: apiRouteOperation({ method: 'GET' })
      .outputs([
        { status: 200, contentType: 'application/json', body: z.array(todoSchema) }
      ])
      .handler((_req, res) => res.status(200).json([{ id: 1, name: 'A' }])),

    createTodo: apiRouteOperation({ method: 'POST' })
      .input({ contentType: 'application/json', body: z.object({ name: z.string() }) })
      .outputs([
        { status: 201, contentType: 'application/json', body: todoSchema },
        { status: 401, contentType: 'application/json', body: z.string() }
      ])
      .middleware((req, res) => {
        if (!req.headers['very-secure']) {
          res.status(401).json('Unauthorized');
          return;
        }
      })
      .handler((req, res) => res.status(201).json({ id: 2, name: req.body.name }))
  },
  {
    openApiPath: { summary: 'Todos API route' }
  }
);
```

## RPC Route (`rpcApiRoute`)

```ts
// src/pages/api/rpc/[operationId].ts
import { rpcApiRoute } from 'next-rest-framework';
import { getTodos, createTodo } from '@/actions';

const handler = rpcApiRoute(
  {
    getTodos,
    createTodo
  },
  {
    openApiPath: { summary: 'RPC API route' }
  }
);

export type RpcClient = typeof handler.client;
export default handler;
```

RPC filename must be `[operationId].ts`.
