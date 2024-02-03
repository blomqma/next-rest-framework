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
  - [Create docs handler](#create-docs-handler)
    - [App router:](#app-router)
    - [Pages router:](#pages-router)
  - [Create endpoint](#create-endpoint)
    - [REST](#rest)
      - [App router:](#app-router-1)
      - [Pages router:](#pages-router-1)
      - [Client](#client)
    - [RPC](#rpc)
      - [App router:](#app-router-2)
      - [Pages router:](#pages-router-2)
      - [Client](#client-1)
- [API reference](#api-reference)
  - [Docs handler options](#docs-handler-options)
  - [Docs config](#docs-config)
  - [REST](#rest-1)
    - [Route handler options](#route-handler-options)
    - [Route operations](#route-operations)
      - [Route operation input](#route-operation-input)
      - [Route operation outputs](#route-operation-outputs)
      - [Route operation middleware](#route-operation-middleware)
      - [Route operation handler](#route-operation-handler)
  - [RPC](#rpc-1)
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

In order to use Next REST Framework you need to have a Next.js project with the following dependencies installed:

- [Next.js](https://github.com/vercel/next.js) >= v12
- [Zod](https://github.com/colinhacks/zod) >= v3
- [TypeScript](https://www.typescriptlang.org/) >= v3

## [Installation](#installation)

```
npm install next-rest-framework
```

## [Getting started](#getting-started)

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

![Next REST Framework docs](./docs/static/img/docs-screenshot.jpg)

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

## [API reference](#api-reference)

### [Docs handler options](#docs-handler-options)

The following options can be passed to the `docsRouteHandler` (app router) and `docsApiRouteHandler` (pages router) functions for customizing Next REST Framework:

| Name              | Description                                                                                                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deniedPaths`     | Array of paths that are denied by Next REST Framework and not included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/disallowed-path', '/api/disallowed-path-2/*', '/api/disallowed-path-3/**']` Defaults to no paths being disallowed. |
| `allowedPaths`    | Array of paths that are allowed by Next REST Framework and included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/allowed-path', '/api/allowed-path-2/*', '/api/allowed-path-3/**']` Defaults to all paths being allowed.               |
| `openApiObject`   | An [OpenAPI Object](https://swagger.io/specification/#openapi-object) that can be used to override and extend the auto-generated specification.                                                                                                                                                                        |
| `openApiJsonPath` | Path that will be used for fetching the OpenAPI spec - defaults to `/openapi.json`. This path also determines the path where this file will be generated inside the `public` folder.                                                                                                                                   |
| `docsConfig`      | A [Docs config](#docs-config) object for customizing the generated docs.                                                                                                                                                                                                                                               |
| `suppressInfo`    | Setting this to `true` will suppress all informational logs from Next REST Framework. Defaults to `false`.                                                                                                                                                                                                             |

### [Docs config](#docs-config)

The docs config options can be used to customize the generated docs:

| Name          | Description                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`    | Determines whether to render the docs using Redoc (`redoc`) or SwaggerUI `swagger-ui`. Defaults to `redoc`. |
| `title`       | Custom title, used for the visible title and HTML title.                                                    |
| `description` | Custom description, used for the visible description and HTML meta description.                             |
| `faviconUrl`  | Custom HTML meta favicon URL.                                                                               |
| `logoUrl`     | A URL for a custom logo.                                                                                    |

### REST

#### [Route handler options](#route-handler-options)

The following options can be passed to the `routeHandler` (app router) and `apiRouteHandler` (pages router) functions to create new API endpoints:

| Name                                                       | Description                                                                                                                                                 | Required |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH` | A [Method handler](#method-handlers) object.                                                                                                                | `true`   |
| `openApiPath`                                              | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification. | `false`  |

#### [Route operations](#route-operations)

The route operation functions `routeOperation` (app router) and `apiRouteOperation` (pages router) allow you to define your API handlers for your endpoints. These functions accept an OpenAPI [Operation object](https://swagger.io/specification/#operation-object) as a parameter, that can be used to override the auto-generated specification. Calling this function allows you to chain your API handler logic with the following functions.

| Name         | Description                                                                                                                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`      | A [Route operation input](#route-operation-input) function for defining the validation and documentation of the request.                                                                                                                                             |
| `outputs`    | An [Route operation outputs](#route-operation-outputs) function for defining the validation and documentation of the response.                                                                                                                                       |
| `handler`    | A [Route operation-handler](#route-operation-handler) function for defining your business logic.                                                                                                                                                                     |
| `middleware` | A [Route operation middleware](#route-operation-middleware) function that gets executed before the request input is validated. You may chain up to three middlewares together and share data between the middlewares by taking the input of the previous middleware. |

##### [Route operation input](#route-operation-input)

The route operation input function is used for type-checking, validation and documentation of the request, taking in an object with the following properties:

| Name          | Description                                                                                                                                                                                            | Required |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `contentType` | The content type header of the request. When the content type is defined, a request with an incorrect content type header will get an error response.                                                  | `false`  |
| `body`        | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the request body. When the body schema is defined, a request with an invalid request body will get an error response.       | `false`  |
| `query`       | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the query parameters. When the query schema is defined, a request with invalid query parameters will get an error response. | `false`  |

Calling the route operation input function allows you to chain your API handler logic with the [Route operation outputs](#route-operation-outputs), [Route operation middleware](#route-operation-middleware) and [Route operation handler](#route-operation-handler) functions.

##### [Route operation outputs](#route-operation-outputs)

The route operation outputs function is used for type-checking and documentation of the response, taking in an array of objects with the following properties:

| Name          | Description                                                                                   | Required |
| ------------- | --------------------------------------------------------------------------------------------- | -------- |
| `status`      | A status code that your API can return.                                                       | `true`   |
| `contentType` | The content type header of the response.                                                      | `true`   |
| `schema`      | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the response data. |  `true`  |

Calling the route operation outputs function allows you to chain your API handler logic with the [Route operation middleware](#route-operation-middleware) and [Route operation handler](#route-operation-handler) functions.

##### [Route operation middleware](#route-operation-middleware)

The route operation middleware function is executed before validating the request input. The function takes in the same parameters as the Next.js [router handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers. Additionally, as a second parameter this function takes the return value of your last middleware function, defaulting to an empty object. Throwing an error inside a middleware function will stop the execution of the handler and you can also return a custom response like you would do within the [Handler](#handler) function. Calling the route operation middleware function allows you to chain your API handler logic with the [Handler](#handler) function. Alternatively, you may chain up to three middleware functions together:

```typescript
// ...
const handler = route({
  getTodos: routeOperation()
    .middleware(() => {
      return { foo: 'bar' };
    })
    .middleware((_req, _ctx, { foo }) => {
      // if (myCondition) {
      //   return NextResponse.json({ error: 'My error.' });
      // }

      return {
        foo,
        bar: 'baz'
      };
    })
    .handler((_req, _ctx, { foo, bar }) => {
      // ...
    })
});
```

##### [Route operation handler](#route-operation-handler)

The route operation handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly-typed versions of the same parameters as the Next.js [router handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers. Additionally, as a third parameter this function takes the return value of your last middleware function:

```typescript
// ...
const handler = route({
  getTodos: routeOperation()
    .middleware(() => {
      return { foo: "bar" };
    })
    .handler((_req, _ctx, { foo }) => {
      // ...
    });
});
```

### RPC

#### [RPC route handler options](#rpc-route-handler-options)

The `rpcRouteHandler` (app router) and `rpcApiRouteHandler` (pages router) functions allow the following options as the second parameter after passing your RPC operations.

| Name               | Description                                                                                                                                                 | Required |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `openApiPath`      | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification. | `false`  |
| `openApiOperation` | An OpenAPI [Path Item Object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated specification. | `false`  |

#### [RPC operations](#rpc-route-operations)

The `rpcOperation` function allows you to define your API handlers for your RPC endpoint. Calling this function allows you to chain your API handler logic with the following functions.

| Name         | Description                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`      | An [RPC operation input](#rpc-operation-input) function for defining the validation and documentation of the operation.                                                                                                                                             |
| `outputs`    | An [RPC operation outputs](#rpc-operation-outputs) function for defining the validation and documentation of the response.                                                                                                                                          |
| `handler`    | An [RPC operation handler](#rpc-operation-handler) function for defining your business logic.                                                                                                                                                                       |
| `middleware` | An [RPC operation middleware](#rpc-operation-middleware) function that gets executed before the operation input is validated. You may chain up to three middlewares together and share data between the middlewares by taking the input of the previous middleware. |

##### [RPC operation input](#rpc-operation-input)

The RPC operation input function is used for type-checking, validation and documentation of the RPC call. It takes in a A [Zod](https://github.com/colinhacks/zod) schema as a parameter that describes the format of the operation input. When the input schema is defined, an RPC call with invalid input will get an error response.

Calling the RPC input function allows you to chain your API handler logic with the [RPC operation outputs](#rpc-operation-outputs), [RPC middleware](#rpc-operation-middleware) and [RPC handler](#rpc-operation-handler) functions.

##### [RPC operation outputs](#rpc-operation-outputs)

The RPC operation outputs function is used for type-checking and documentation of the response, taking in an array of objects with the following properties:

| Name     | Description                                                                                   | Required |
| -------- | --------------------------------------------------------------------------------------------- | -------- |
| `schema` | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the response data. |  `true`  |
| `name`   | An optional name used in the generated OpenAPI spec, e.g. `GetTodosErrorResponse`.            | `false`  |

Calling the RPC operation outputs function allows you to chain your API handler logic with the [RPC operation middleware](#rpc-operation-middleware) and [RPC operation handler](#rpc-operation-handler) functions.

##### [RPC operation middleware](#rpc-operation-middleware)

The RPC operation middleware function is executed before validating RPC operation input. The function takes in strongly typed parameters typed by the [RPC operation input](#rpc-operation-input) function. Additionally, as a second parameter this function takes the return value of your last middleware function, defaulting to an empty object. Throwing an error inside a middleware function will stop the execution of the handler. Calling the RPC operation middleware function allows you to chain your RPC API handler logic with the [RPC operation handler](#rpc-operation-handler) function. Alternatively, you may chain up to three middleware functions together:

```typescript
// ...
const handler = rpcRoute({
  getTodos: rpcOperation()
    .middleware(() => {
      return { foo: 'bar' };
    })
    .middleware((_input, { foo }) => {
      // if (myCondition) {
      //   throw Error('My error.')
      // }

      return {
        foo,
        bar: 'baz'
      };
    })
    .handler((_input, { foo, bar }) => {
      // ...
    })
});
```

##### [RPC operation handler](#rpc-operation-handler)

The RPC operation handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly typed parameters typed by the [RPC operation input](#rpc-operation-input) function. Additionally, as a second parameter this function takes the return value of your last middleware function:

```typescript
// ...
const handler = rpcApiRoute({
  getTodos: rpcOperation()
    .middleware(() => {
      return { foo: "bar" };
    })
    .handler((_input, { foo }) => {
      // ...
    });
});
```

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
// package.json
...
"scripts": {
  ...
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
