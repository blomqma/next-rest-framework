<p align="center">
  <br/>
  <img width="250px" src="https://raw.githubusercontent.com/blomqma/next-rest-framework/d02224b38d07ede85257b22ed50159a947681f99/packages/next-rest-framework/logo.svg" />
  <h2 align="center">Next REST Framework</h3>
  <p align="center">Type-safe, self-documenting APIs for Next.js</p>
  <br/>
  <p align="center">
    <a href="https://github.com/blomqma/next-rest-framework/actions?query=branch%3Amain">
      <img src="https://github.com/blomqma/next-rest-framework/actions/workflows/ci.yml/badge.svg?event=push&branch=main" alt="CI status" />
    </a>
    <a href="https://codecov.io/gh/blomqma/next-rest-framework" >
      <img src="https://codecov.io/gh/blomqma/next-rest-framework/branch/main/graph/badge.svg?token=IUG5ZCVGPV"/>
    </a>
    <a href="https://github.com/blomqma/next-rest-framework/stargazers">
      <img src="https://img.shields.io/github/stars/blomqma/next-rest-framework" alt="Github Stars" />
    </a>
    <a href="https://opensource.org/licenses/ISC" rel="nofollow">
      <img src="https://img.shields.io/badge/License-ISC-blue.svg" alt="License">
    </a>
    <img src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg" alt="Contributor Covenant 2.1" />
  </p>
</p>

## Table of contents

- [Table of contents](#table-of-contents)
- [Overview](#overview)
- [Features](#features)
  - [Lightweight, type-safe, easy to use](#lightweight-type-safe-easy-to-use)
- [Requirements](#requirements)
- [Installation](#installation)
- [Getting started](#getting-started)
  - [Create docs endpoint](#create-docs-endpoint)
    - [App router docs route:](#app-router-docs-route)
    - [Pages router docs API route:](#pages-router-docs-api-route)
  - [Create endpoint](#create-endpoint)
    - [REST endpoints](#rest-endpoints)
      - [App router route:](#app-router-route)
      - [Pages router API route:](#pages-router-api-route)
    - [Form endpoints](#form-endpoints)
      - [App router form route:](#app-router-form-route)
      - [Pages router form API route:](#pages-router-form-api-route)
    - [RPC endpoints](#rpc-endpoints)
      - [App router RPC route:](#app-router-rpc-route)
      - [Pages router RPC API route:](#pages-router-rpc-api-route)
  - [Client](#client)
    - [REST client](#rest-client)
    - [RPC client](#rpc-client)
- [API reference](#api-reference)
  - [Docs handler options](#docs-handler-options)
  - [Docs config](#docs-config)
  - [REST](#rest)
    - [Route handler options](#route-handler-options)
    - [Route operations](#route-operations)
      - [Route operation input](#route-operation-input)
      - [Route operation outputs](#route-operation-outputs)
      - [Route operation middleware](#route-operation-middleware)
      - [Route operation handler](#route-operation-handler)
  - [RPC](#rpc)
    - [RPC route handler options](#rpc-route-handler-options)
    - [RPC operations](#rpc-operations)
      - [RPC operation input](#rpc-operation-input)
      - [RPC operation outputs](#rpc-operation-outputs)
      - [RPC operation middleware](#rpc-operation-middleware)
      - [RPC operation handler](#rpc-operation-handler)
- [CLI](#cli)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## [Overview](#overview)

Next REST Framework is an open-source, opinionated, lightweight, easy-to-use set of tools to build type-safe, self-documenting APIs with [Next.js](http://nextjs.org/). Building OpenAPI specification-compliant APIs can be cumbersome and slow but Next REST Framework makes this easy with auto-generated OpenAPI documents and docs using TypeScript and object schemas.

- [Live demo](https://next-rest-framework-demo.vercel.app)
- [Docs](https://next-rest-framework.vercel.app)

This is a monorepo containing the following packages / projects:

1. The primary `next-rest-framework` package
2. An example application for live demo and local development

## [Features](#features)

### Lightweight, type-safe, easy to use

- Designed to work with TypeScript so that your requests and responses are strongly typed.
- Supports API endpoints using both RESTful and RPC principles.
- Object-schema validation with [Zod](https://github.com/colinhacks/zod). The object schemas are automatically converted to JSON schema format for the auto-generated OpenAPI specification.
- Auto-generated and extensible `openapi.json` spec file from your business logic.
- Auto-generated [Redoc](https://github.com/Redocly/redoc) and/or [SwaggerUI](https://swagger.io/tools/swagger-ui/) documentation frontend.
- Works with Next.js [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) and other server-side libraries, like [NextAuth.js](#https://github.com/nextauthjs/next-auth).
- Supports both Next.js [app router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [pages router](https://nextjs.org/docs/pages/building-your-application/routing), even at the same time.
- Supports [Edge runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes).
- Fully customizable and compatible with any existing Next.js project.

## Requirements

- Node.js v18.x. If you have an API using `File` or `FormData` web APIs, you might need Node v20.x, see: https://github.com/vercel/next.js/discussions/56032

You also need the following dependencies installed in you Next.js project:

- [Next.js](https://github.com/vercel/next.js) >= v12
- [Zod](https://github.com/colinhacks/zod) >= v3
- [TypeScript](https://www.typescriptlang.org/) >= v3
- Optional, needed if working with forms: [zod-form-data](https://www.npmjs.com/package/zod-form-data) >= v2

## [Installation](#installation)

```sh
npm install next-rest-framework
```

## [Getting started](#getting-started)

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

![Next REST Framework docs](./docs/static/img/docs-screenshot.jpg)

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

## [API reference](#api-reference)

### [Docs handler options](#docs-handler-options)

The following options can be passed to the `docsRoute` (app router) and `docsApiRoute` (pages router) functions for customizing Next REST Framework:

| Name              | Description                                                                                                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deniedPaths`     | Array of paths that are denied by Next REST Framework and not included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/disallowed-path', '/api/disallowed-path-2/*', '/api/disallowed-path-3/**']` Defaults to no paths being disallowed. |
| `allowedPaths`    | Array of paths that are allowed by Next REST Framework and included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/allowed-path', '/api/allowed-path-2/*', '/api/allowed-path-3/**']` Defaults to all paths being allowed.               |
| `openApiObject`   | An [OpenAPI Object](https://swagger.io/specification/#openapi-object) that can be used to override and extend the auto-generated specification.                                                                                                                                                                        |
| `openApiJsonPath` | Path that will be used for fetching the OpenAPI spec - defaults to `/openapi.json`. This path also determines the path where this file will be generated inside the `public` folder.                                                                                                                                   |
| `docsConfig`      | A [Docs config](#docs-config) object for customizing the generated docs.                                                                                                                                                                                                                                               |

### [Docs config](#docs-config)

The docs config options can be used to customize the generated docs:

| Name          | Description                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`    | Determines whether to render the docs using Redoc (`redoc`) or SwaggerUI `swagger-ui`. Defaults to `redoc`.                                  |
| `title`       | Custom title, used for the visible title and HTML title.                                                                                     |
| `description` | Custom description, used for the visible description and HTML meta description.                                                              |
| `faviconUrl`  | Custom HTML meta favicon URL.                                                                                                                |
| `logoUrl`     | A URL for a custom logo.                                                                                                                     |
| `ogConfig`    | [Basic customization options](https://ogp.me/#metadata) for OG meta tags. Requires the following fields: `title`, `type`, `url`, `imageUrl`. |

### REST

#### [Route handler options](#route-handler-options)

The `routeHandler` (app router) and `apiRouteHandler` (pages router) functions allow you to pass an object as the second parameter, where you can define a property called `openApiPath`. This property is an OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification for the given route.

#### [Route operations](#route-operations)

The route operation functions `routeOperation` (app router) and `apiRouteOperation` (pages router) allow you to define your method handlers for your endpoints. These functions require you to pass an object where you will define the method for the given operation, as well as optionally a property called `openApiOperation`. This property is an OpenAPI [Operation object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated specification for the given operation. Calling the `routeOperation` and `apiRouteOperation` functions allows you to chain your API handler logic with the following functions:

| Name         | Description                                                                                                                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`      | A [Route operation input](#route-operation-input) function for defining the validation and documentation of the request.                                                                                                                                             |
| `outputs`    | An [Route operation outputs](#route-operation-outputs) function for defining the validation and documentation of the response.                                                                                                                                       |
| `handler`    | A [Route operation-handler](#route-operation-handler) function for defining your business logic.                                                                                                                                                                     |
| `middleware` | A [Route operation middleware](#route-operation-middleware) function that gets executed before the request input is validated. You may chain up to three middlewares together and share data between the middlewares by taking the input of the previous middleware. |

##### [Route operation input](#route-operation-input)

The route operation input function is used for type-checking, validation and documentation of the request, taking in an object with the following properties:

| Name          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Required |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type header of the request. When the content type is defined, a request with an incorrect content type header will get an error response.                                                                                                                                                                                                                                                                                                                  | `false`  |
| `body`        | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the request body. When using `application/x-www-form-urlencoded` or `multipart/form-data` content types, this should be a `zod-form-data` schema instead. When the body schema is defined, a request with an invalid request body will get an error response. The request body is parsed using this schema and updated to the request if valid, so the body should always match the schema. | `false`  |
| `bodySchema`  | A JSON schema that you can provide in case the conversion of the `body` Zod schema fails or produces an incorrect result in your OpenAPI spec.                                                                                                                                                                                                                                                                                                                         | `false`  |
| `query`       | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the query parameters. When the query schema is defined, a request with invalid query parameters will get an error response. Query parameters are parsed using this schema and updated to the request if valid, so the query parameters from the request should always match the schema.                                                                                                     | `false`  |
| `querySchema` | A JSON schema that you can provide in case the conversion of the `query` Zod schema fails or produces an incorrect result in your OpenAPI spec.                                                                                                                                                                                                                                                                                                                        | `false`  |
| `params`      | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the path parameters for strong typing when using them in your route handler.                                                                                                                                                                                                                                                                                                                | `false`  |

Calling the route operation input function allows you to chain your API handler logic with the [Route operation outputs](#route-operation-outputs), [Route operation middleware](#route-operation-middleware) and [Route operation handler](#route-operation-handler) functions.

##### [Route operation outputs](#route-operation-outputs)

The route operation outputs function is used for type-checking and documentation of the response, taking in an array of objects with the following properties:

| Name          | Description                                                                                                                                    | Required |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `status`      | A status code that your API can return.                                                                                                        | `true`   |
| `contentType` | The content type header of the response.                                                                                                       | `true`   |
| `body`        | A [Zod](https://github.com/colinhacks/zod) (or `zod-form-data`) schema describing the format of the response data.                             |  `true`  |
| `bodySchema`  | A JSON schema that you can provide in case the conversion of the `body` Zod schema fails or produces an incorrect result in your OpenAPI spec. | `false`  |
| `name`        | An optional name used in the generated OpenAPI spec for the response body, e.g. `GetTodosSuccessResponse`.                                     | `false`  |

Calling the route operation outputs function allows you to chain your API handler logic with the [Route operation middleware](#route-operation-middleware) and [Route operation handler](#route-operation-handler) functions.

##### [Route operation middleware](#route-operation-middleware)

The route operation middleware function is executed before validating the request input. The function takes in the same parameters as the Next.js [router handler](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) (app router) and [API route](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) (pages router) functions. Additionally, as a second parameter this function takes the return value of your last middleware function, defaulting to an empty object. Throwing an error inside a middleware function will stop the execution of the handler and you can also return a custom response like you would do within the [Route operation handler](#route-operation-handler) function. Calling the route operation middleware function allows you to chain your API handler logic with the [Route operation handler](#route-operation-handler) function. Alternatively, you may chain up to three middleware functions together:

```typescript
// App router.
export const { GET } = route({
  getTodos: routeOperation({ method: 'GET' })
    .middleware(() => {
      return { foo: 'bar' };
    })
    .middleware((_req, _ctx, { foo }) => {
      if (myCondition) {
        return NextResponse.json({ error: 'My error.' }, { status: 400 });
      }

      return {
        foo,
        bar: 'baz'
      };
    })
    .handler((_req, _ctx, { foo, bar }) => {
      // ...
    })
});

// Pages router.
export default apiRoute({
  getTodos: routeOperation({ method: 'GET' })
    .middleware(() => {
      return { foo: 'bar' };
    })
    .middleware((req, res, { foo }) => {
      if (myCondition) {
        res.status(400).json({ error: 'My error.' });
        return;
      }

      return {
        foo,
        bar: 'baz'
      };
    })
    .handler((req, res, { foo, bar }) => {
      // ...
    })
});
```

##### [Route operation handler](#route-operation-handler)

The route operation handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly-typed versions of the same parameters as the Next.js [router handler](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) (app router) and [API route](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) (pages router) functions. Additionally, as a third parameter this function takes the return value of your last middleware function (see above), defaulting to an empty object.

### RPC

#### [RPC route handler options](#rpc-route-handler-options)

The `rpcRouteHandler` (app router) and `rpcApiRouteHandler` (pages router) functions allow you to pass an object as the second parameter, where you can define a property called `openApiPath`. This property is an OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification for the given route.

#### [RPC operations](#rpc-operations)

The `rpcOperation` function allows you to define your API handlers for your RPC endpoint. This function allows you to pass an OpenAPI [Operation object](https://swagger.io/specification/#operation-object) as a parameter, that can be used to override and extend the auto-generated specification for the given operation. Calling this function allows you to chain your API handler logic with the following functions.

| Name         | Description                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`      | An [RPC operation input](#rpc-operation-input) function for defining the validation and documentation of the operation.                                                                                                                                             |
| `outputs`    | An [RPC operation outputs](#rpc-operation-outputs) function for defining the validation and documentation of the response.                                                                                                                                          |
| `handler`    | An [RPC operation handler](#rpc-operation-handler) function for defining your business logic.                                                                                                                                                                       |
| `middleware` | An [RPC operation middleware](#rpc-operation-middleware) function that gets executed before the operation input is validated. You may chain up to three middlewares together and share data between the middlewares by taking the input of the previous middleware. |

##### [RPC operation input](#rpc-operation-input)

The RPC operation input function is used for type-checking, validation and documentation of the RPC call, taking in an object with the following properties:

| Name          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Required |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type header of the request, limited to `application/json`, `application/x-www-form-urlencoded` and `multipart/form-data`. When the content type is defined, a request with an incorrect content type header will get an error response.                                                                                                                                                                                                                    | `false`  |
| `body`        | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the request body. When using `application/x-www-form-urlencoded` or `multipart/form-data` content types, this should be a `zod-form-data` schema instead. When the body schema is defined, a request with an invalid request body will get an error response. The request body is parsed using this schema and updated to the request if valid, so the body should always match the schema. | `false`  |
| `bodySchema`  | A JSON schema that you can provide in case the conversion of the `body` Zod schema fails or produces an incorrect result in your OpenAPI spec.                                                                                                                                                                                                                                                                                                                         | `false`  |

Calling the RPC input function allows you to chain your API handler logic with the [RPC operation outputs](#rpc-operation-outputs), [RPC middleware](#rpc-operation-middleware) and [RPC handler](#rpc-operation-handler) functions.

##### [RPC operation outputs](#rpc-operation-outputs)

The RPC operation outputs function is used for type-checking and documentation of the response, taking in an array of objects with the following properties:

| Name         | Description                                                                                                                                    | Required |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `body`       | A [Zod](https://github.com/colinhacks/zod) (or `zod-form-data`) schema describing the format of the response data.                             |  `true`  |
| `bodySchema` | A JSON schema that you can provide in case the conversion of the `body` Zod schema fails or produces an incorrect result in your OpenAPI spec. | `false`  |
| `name`       | An optional name used in the generated OpenAPI spec for the response body, e.g. `GetTodosSuccessResponse`.                                     | `false`  |

Calling the RPC operation outputs function allows you to chain your API handler logic with the [RPC operation middleware](#rpc-operation-middleware) and [RPC operation handler](#rpc-operation-handler) functions.

##### [RPC operation middleware](#rpc-operation-middleware)

The RPC operation middleware function is executed before validating RPC operation input. The function takes in strongly typed parameters typed by the [RPC operation input](#rpc-operation-input) function. Additionally, as a second parameter this function takes the return value of your last middleware function, defaulting to an empty object. Throwing an error inside a middleware function will stop the execution of the handler. Calling the RPC operation middleware function allows you to chain your RPC API handler logic with the [RPC operation handler](#rpc-operation-handler) function. Alternatively, you may chain up to three middleware functions together:

```typescript
// App router.
export const { POST } = rpcRoute({
  getTodos: rpcOperation()
    .middleware(() => {
      return { foo: 'bar' };
    })
    .middleware((_input, { foo }) => {
      if (myCondition) {
        throw Error('My error.');
      }

      return {
        foo,
        bar: 'baz'
      };
    })
    .handler((_input, { foo, bar }) => {
      // ...
    })
});

// Pages router.
export default rpcApiRoute({
  // ... Same as above.
});
```

##### [RPC operation handler](#rpc-operation-handler)

The RPC operation handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly typed parameters typed by the [RPC operation input](#rpc-operation-input) function. Additionally, as a second parameter this function takes the return value of your last middleware function (see above), defaulting to an empty object.

## [CLI](#cli)

The Next REST Framework CLI supports generating and validating the `openapi.json` file:

- `npx next-rest-framework generate` to generate the `openapi.json` file.
- `npx next-rest-framework validate` to validate that the `openapi.json` file is up-to-date.

The `next-rest-framework validate` command is useful to have as part of the static checks in your CI/CD pipeline. Both commands support the following options:

| Name                    | Description                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--configPath <string>` | In case you have multiple docs handlers with different configurations, you can specify which configuration you want to use by providing the path to the API. Example: `/api/my-configuration`. |

A good practice is to set these in your `package.json` as both commands are needed:

```json
"scripts": {
  "generate": "next-rest-framework generate",
  "validate": "next-rest-framework validate",
}
```

## [Changelog](#changelog)

See the changelog in [CHANGELOG.md](https://github.com/blomqma/next-rest-framework/blob/main/CHANGELOG.md)

## [Contributing](#contributing)

All contributions are welcome!

## [License](#license)

ISC, see full license in [LICENSE](https://github.com/blomqma/next-rest-framework/blob/main/LICENCE).
