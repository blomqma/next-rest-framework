---
sidebar_position: 2
---

# Getting started

## Requirements

- Node.js v18.x. If you have an API using `File` or `FormData` web APIs, you might need Node v20.x, see: https://github.com/vercel/next.js/discussions/56032

You also need the following dependencies installed in you Next.js project:

- [Next.js](https://github.com/vercel/next.js) >= v12
- Optional (needed for validating input): [Zod](https://github.com/colinhacks/zod) >= v3
- Optional: [TypeScript](https://www.typescriptlang.org/) >= v3
- Optional (needed when using the CLI commands and using TypeScript): [tsx](https://github.com/privatenumber/tsx) >= v4
- Optional (needed if working with forms): [zod-form-data](https://www.npmjs.com/package/zod-form-data) >= v2

## [Installation](#installation)

```sh
npm install next-rest-framework
```

### [Create docs endpoint](#create-docs-endpoint)

To get access to the auto-generated documentation, initialize the docs endpoint somewhere in your codebase. You can also skip this step if you don't want to expose a public API documentation.

#### [App router docs route](#app-router-docs-route):

```typescript
// src/app/api/v2/route.ts

import { docsRoute } from 'next-rest-framework';

// export const runtime = 'edge'; // Edge runtime is supported.

export const { GET } = docsRoute({
  // deniedPaths: [...] // Ignore endpoints from the generated OpenAPI spec.
  // allowedPaths: [...], // Explicitly set which endpoints to include in the generated OpenAPI spec.
  // Override and customize the generated OpenAPI spec.
  openApiObject: {
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'My API description.'
    }
    // ...
  },
  // openApiJsonPath: '/openapi.json', // Customize the path where the OpenAPI spec will be generated.
  // Customize the rendered documentation.
  docsConfig: {
    provider: 'redoc', // redoc | swagger-ui
    title: 'My API',
    description: 'My API description.'
    // ...
  }
});
```

#### [Pages router docs API route](#pages-router-docs-api-route):

```typescript
// src/pages/api/v1/index.ts

import { docsApiRoute } from 'next-rest-framework';

export default docsApiRoute({
  // See configuration options from above.
});
```

This is enough to get you started. Now you can access the API documentation in your browser. Running `npx next-rest-framework generate` in the project root will generate the `openapi.json` OpenAPI specification file, located in the `public` folder by default. You can create multiple docs endpoints if needed and specify which config to use for the [CLI](#cli). See the full configuration options of this endpoint in the [Docs handler options](#docs-handler-options) section.

### [Create endpoint](#create-endpoint)

#### [REST endpoints](#rest-endpoints)

##### [App router route](#app-router-route):

```typescript
// src/app/api/v2/todos/route.ts

import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

// export const runtime = 'edge'; // Edge runtime is supported.

const MOCK_TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
  // ...
];

const todoSchema = z.object({
  id: z.number(),
  name: z.string(),
  completed: z.boolean()
});

export const { GET, POST } = route({
  getTodos: routeOperation({
    method: 'GET'
  })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: z.array(todoSchema)
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
      body: z.object({
        name: z.string()
      })
    })
    .outputs([
      {
        status: 201,
        contentType: 'application/json',
        body: z.string()
      },
      {
        status: 401,
        contentType: 'application/json',
        body: z.string()
      }
    ])
    // Optional middleware logic executed before request validation.
    .middleware((req) => {
      if (!req.headers.get('very-secure')) {
        return TypedNextResponse.json('Unauthorized', {
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
```

The `TypedNextResponse` ensures that the response status codes and content-type headers are type-checked against the defined outputs. You can still use the regular `NextResponse` if you prefer to have less type-safety.

When using the default `nodejs` runtime with app router routes (`docsRoute` or `route`), you may encounter the [Dynamic server usage](https://nextjs.org/docs/messages/dynamic-server-error) Next.js error when running `next build`. In that case you should force the route to be dynamically rendered with the [dynamic](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic) option:

```typescript
export const dynamic = 'force-dynamic';
```

##### [Pages router API route](#pages-router-api-route):

```typescript
// src/pages/api/v1/todos/index.ts

import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { z } from 'zod';

const MOCK_TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
  // ...
];

const todoSchema = z.object({
  id: z.number(),
  name: z.string(),
  completed: z.boolean()
});

export default apiRoute({
  getTodos: apiRouteOperation({
    method: 'GET'
  })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: z.array(todoSchema)
      }
    ])
    .handler((_req, res) => {
      res.status(200).json(MOCK_TODOS);
    }),

  createTodo: apiRouteOperation({
    method: 'POST'
  })
    .input({
      contentType: 'application/json',
      body: z.object({
        name: z.string()
      })
    })
    .outputs([
      {
        status: 201,
        contentType: 'application/json',
        body: z.string()
      },
      {
        status: 401,
        contentType: 'application/json',
        body: z.string()
      }
    ])
    // Optional middleware logic executed before request validation.
    .middleware((req, res) => {
      if (!req.headers['very-secure']) {
        res.status(401).json('Unauthorized');
      }
    })
    .handler((req, res) => {
      const { name } = req.body;
      // Create a new TODO.
      res.status(201).json(`New TODO created: ${name}`);
    })
});
```

After running `next-rest-framework generate`, all of above type-safe endpoints will be auto-generated to your OpenAPI spec and exposed in the documentation:

![Next REST Framework docs](@site/static/img/docs-screenshot.jpg)

#### [Form endpoints](#form-endpoints)

##### [App router form route](#app-router-form-route):

When specifying request input schema for validation, the content type header determines what kind of schema you can use to validate the request body.
When using `application/json`, a plain Zod object schema can be used for the validation. When using `application/x-www-form-urlencoded` or `multipart/form-data` content types, a [zod-form-data](https://www.npmjs.com/package/zod-form-data) schema must be used:

```typescript
// src/app/api/v2/form-data/url-encoded/route.ts

import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { zfd } from 'zod-form-data';

// export const runtime = 'edge'; // Edge runtime is supported.

const formSchema = zfd.formData({
  text: zfd.text()
});

export const { POST } = route({
  urlEncodedFormData: routeOperation({
    method: 'POST'
  })
    .input({
      contentType: 'application/x-www-form-urlencoded',
      body: formSchema // A zod-form-data schema is required.
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/octet-stream',
        body: formSchema
      }
    ])
    .handler(async (req) => {
      const { text } = await req.json();
      // const formData = await req.formData(); // Form can also be parsed as form data.

      // Type-checked response.
      return TypedNextResponse.json({
        text
      });
    })
});
```

For `multipart/form-data` app router example, see [this example](https://github.com/blomqma/next-rest-framework/tree/main/apps/example/src/app/api/v2/form-data/multipart/route.ts).

##### [Pages router form API route](#pages-router-form-api-route):

A form API route with pages router works similarly as the [App router form route](#app-router-form-route) using a `zod-form-data` schema:

```typescript
// src/pages/api/v1/form-data/url-encoded/index.ts

import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { zfd } from 'zod-form-data';

const formSchema = zfd.formData({
  text: zfd.text()
});

export default apiRoute({
  urlEncodedFormData: apiRouteOperation({
    method: 'POST'
  })
    .input({
      contentType: 'application/x-www-form-urlencoded',
      body: formSchema // A zod-form-data schema is required.
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: formSchema
      }
    ])
    .handler((req, res) => {
      const formData = req.body;

      res.json({
        text: formData.get('text')
      });
    })
});
```

For `multipart/form-data` pages router example, see [this example](https://github.com/blomqma/next-rest-framework/tree/main/apps/example/pages/api/v1/form-data/multipart/index.ts/form-data/multipart/index.ts).

The form routes will also be included in your OpenAPI spec after running `next-rest-framework generate`.

#### [RPC endpoints](#rpc-endpoints)

Next REST Framework also supports writing RPC-styled APIs that support JSON and form data. A recommended way is to write your RPC operations in a separate server-side module where they can be consumed both by the RPC endpoints and directly as server-side functions (server actions):

```typescript
// src/app/actions.ts

'use server';

import { rpcOperation } from 'next-rest-framework';
import { z } from 'zod';
import { zfd } from 'zod-form-data';

// The RPC operations can be used as server-actions and imported in the RPC route handlers.

const MOCK_TODOS = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  }
  // ...
];

const todoSchema = z.object({
  id: z.number(),
  name: z.string(),
  completed: z.boolean()
});

export const getTodos = rpcOperation()
  .outputs([
    {
      body: z.array(todoSchema)
    }
  ])
  .handler(() => {
    return MOCK_TODOS;
  });

export const getTodoById = rpcOperation()
  .input({
    contentType: 'application/json',
    body: z.string()
  })
  .outputs([
    {
      body: z.object({
        error: z.string()
      })
    },
    {
      body: todoSchema
    }
  ])
  .handler((id) => {
    const todo = MOCK_TODOS.find((t) => t.id === Number(id));

    if (!todo) {
      return { error: 'TODO not found.' };
    }

    return todo;
  });

export const createTodo = rpcOperation()
  .input({
    contentType: 'application/json',
    body: z.object({
      name: z.string()
    })
  })
  .outputs([{ body: todoSchema }])
  .handler(async ({ name }) => {
    const todo = { id: 4, name, completed: false };
    return todo;
  });

export const deleteTodo = rpcOperation()
  .input({
    contentType: 'application/json',
    body: z.string()
  })
  .outputs([
    { body: z.object({ error: z.string() }) },
    { body: z.object({ message: z.string() }) }
  ])
  .handler((id) => {
    const todo = MOCK_TODOS.find((t) => t.id === Number(id));

    if (!todo) {
      return {
        error: 'TODO not found.'
      };
    }

    return { message: 'TODO deleted.' };
  });

const formSchema = zfd.formData({
  text: zfd.text()
});

export const formDataUrlEncoded = rpcOperation()
  .input({
    contentType: 'application/x-www-form-urlencoded',
    body: formSchema // A zod-form-data schema is required.
  })
  .outputs([{ body: formSchema }])
  .handler((formData) => {
    return {
      text: formData.get('text')
    };
  });

const multipartFormSchema = zfd.formData({
  text: zfd.text(),
  file: zfd.file()
});

export const formDataMultipart = rpcOperation()
  .input({
    contentType: 'multipart/form-data',
    body: multipartFormSchema // A zod-form-data schema is required.
  })
  .outputs([
    {
      body: z.custom<File>(),
      // The binary file cannot described with a Zod schema so we define it by hand for the OpenAPI spec.
      bodySchema: {
        type: 'string',
        format: 'binary'
      }
    }
  ])
  .handler((formData) => {
    const file = formData.get('file');
    return file;
  });
```

Now you can consume the RPC operations directly in your server-side components:

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

##### [App router RPC route](#app-router-rpc-route):

The file path to an RPC route must end with `/[operationId]/route.ts`. Simply import the RPC operations in to your RPC route handler:

```typescript
// src/app/api/rpc/[operationId]/route.ts

import {
  createTodo,
  deleteTodo,
  getTodoById,
  getTodos,
  formDataUrlEncoded,
  formDataMultipart
} from 'src/app/actions';
import { rpcRoute } from 'next-rest-framework';

// export const runtime = 'edge'; // Edge runtime is supported.

export const { POST } = rpcRoute({
  getTodos,
  getTodoById,
  createTodo,
  deleteTodo,
  formDataUrlEncoded,
  formDataMultipart
  // You can also inline the RPC operations in this object if you don't need to use server actions.
});

export type RpcClient = typeof POST.client;
```

##### [Pages router RPC API route](#pages-router-rpc-api-route):

The filename of an RPC API route must be `[operationId].ts`.

```typescript
// src/pages/api/rpc/[operationId].ts

import { rpcApiRoute } from 'next-rest-framework';
// import { ... } from 'src/app/actions';

const handler = rpcApiRoute({
  // ...
  // Exactly the same as the app router example above.
});

export default handler;

export type RpcClient = typeof handler.client;
```

The RPC routes will also be included in your OpenAPI spec after running `next-rest-framework generate`.

### [Client](#client)

#### [REST client](#rest-client)

To achieve end-to-end type-safety with your REST endpoints, you can use any client implementation that relies on the generated OpenAPI specification, e.g. [openapi-client-axios](https://github.com/openapistack/openapi-client-axios).

#### [RPC client](#rpc-client)

While you can consume your RPC operations directly as server actions in your React server components, for client-rendered components you can use the strongly-typed `rpcClient`, passing in the exported type from your RPC endpoint as a generic parameter:

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
