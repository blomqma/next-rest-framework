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
- [Installation](#installation)
- [Getting started](#getting-started)
  - [Create docs handler](#create-docs-handler)
    - [App Router:](#app-router)
    - [Pages Router:](#pages-router)
  - [Create endpoint](#create-endpoint)
    - [REST](#rest)
      - [App Router:](#app-router-1)
      - [Pages Router:](#pages-router-1)
    - [RPC](#rpc)
      - [App Router:](#app-router-2)
      - [Pages Router:](#pages-router-2)
      - [Client](#client)
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
- Supports both Next.js [App Router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [Pages Router](https://nextjs.org/docs/pages/building-your-application/routing), even at the same time.
- Fully customizable and compatible with any existing Next.js project.

## [Installation](#installation)

```
npm install next-rest-framework
```

## [Getting started](#getting-started)

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

You can also define your APIs with RPC route handlers that also auto-generate the OpenAPI spec. The RPC endpoints can be consumed with the type-safe API client for end-to-end type safety.

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

export type ApiRouteRpcClient = typeof handler.client;
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

![Next REST Framework docs](./docs/static/img/docs-screenshot.jpg)

## [API reference](#api-reference)

### [Docs handler options](#docs-handler-options)

The following options can be passed to the `docsRouteHandler` (App Router) and `docsApiRouteHandler` (Pages Router) functions for customizing Next REST Framework:

| Name                      | Description                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deniedPaths`             | Array of paths that are denied by Next REST Framework and not included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/disallowed-path', '/api/disallowed-path-2/*', '/api/disallowed-path-3/**']` Defaults to no paths being disallowed. |
| `allowedPaths`            | Array of paths that are allowed by Next REST Framework and included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/allowed-path', '/api/allowed-path-2/*', '/api/allowed-path-3/**']` Defaults to all paths being allowed.               |
| `openApiObject`           | An [OpenAPI Object](https://swagger.io/specification/#openapi-object) that can be used to override and extend the auto-generated specification.                                                                                                                                                                        |
| `openApiJsonPath`         | Path that will be used for fetching the OpenAPI spec - defaults to `/openapi.json`. This path also determines the path where this file will be generated inside the `public` folder.                                                                                                                                   |
| `autoGenerateOpenApiSpec` | Setting this to `false` will not automatically update the generated OpenAPI spec when calling the docs handler endpoints. Defaults to `true`.                                                                                                                                                                          |
| `docsConfig`              | A [Docs config](#docs-config) object for customizing the generated docs.                                                                                                                                                                                                                                               |
| `suppressInfo`            | Setting this to `true` will suppress all informational logs from Next REST Framework. Defaults to `false`.                                                                                                                                                                                                             |

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

The following options cam be passed to the `routeHandler` (App Router) and `apiRouteHandler` (Pages Router) functions to create new API endpoints:

| Name                                                       | Description                                                                                                                                                 | Required |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH` | A [Method handler](#method-handlers) object.                                                                                                                | `true`   |
| `openApiPath`                                              | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification. | `false`  |

#### [Route operations](#route-operations)

The route operation functions `routeOperation` (App Router) and `apiRouteOperation` (Pages Router) allow you to define your API handlers for your endpoints. These functions accept an OpenAPI [Operation object](https://swagger.io/specification/#operation-object) as a parameter, that can be used to override the auto-generated specification. Calling this function allows you to chain your API handler logic with the following functions.

| Name         | Description                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`      | A [Route operation input](#route-operation-input) function for defining the validation and documentation of the request.       |
| `outputs`    | An [Route operation outputs](#route-operation-outputs) function for defining the validation and documentation of the response. |
| `handler`    | A [Route operation-handler](#route-operation-handler) function for defining your business logic.                               |
| `middleware` | A [Route operation middleware](#route-operation-middleware) function that gets executed before the request input is validated. |

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

The route operation middleware function is executed before validating the request input. The function takes in the same parameters as the Next.js [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers.

Calling the route operation middleware function allows you to chain your API handler logic with the [Handler](#handler) function.

##### [Route operation handler](#route-operation-handler)

The route operation handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly-typed versions of the same parameters as the Next.js [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers.

### RPC

#### [RPC route handler options](#rpc-route-handler-options)

The `rpcRouteHandler` (App Router) and `rpcApiRouteHandler` (Pages Router) functions allow the following options as the second parameter after passing your RPC operations.

| Name               | Description                                                                                                                                                 | Required |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `openApiPath`      | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification. | `false`  |
| `openApiOperation` | An OpenAPI [Path Item Object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated specification. | `false`  |

#### [RPC operations](#rpc-route-operations)

The `rpcOperation` function allows you to define your API handlers for your RPC endpoint. Calling this function allows you to chain your API handler logic with the following functions.

| Name         | Description                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `input`      | An [RPC operation input](#rpc-operation-input) function for defining the validation and documentation of the operation.       |
| `outputs`    | An [RPC operation outputs](#rpc-operation-outputs) function for defining the validation and documentation of the response.    |
| `handler`    | An [RPC operation handler](#rpc-operation-handler) function for defining your business logic.                                 |
| `middleware` | An [RPC operation middleware](#rpc-operation-middleware) function that gets executed before the operation input is validated. |

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

The RPC operation middleware function is executed before validating RPC operation input. The function takes in strongly typed parameters typed by the [RPC operation input](#rpc-operation-input) function.

Calling the RPC operation middleware function allows you to chain your RPC API handler logic with the [RPC operation handler](#rpc-operation-handler) function.

##### [RPC operation handler](#rpc-operation-handler)

The RPC operation handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly typed parameters typed by the [RPC operation input](#rpc-operation-input) function.

## [CLI](#cli)

The Next REST Framework CLI supports generating and validating the `openapi.json` file:

- `npx next-rest-framework generate` to generate the `openapi.json` file.
- `npx next-rest-framework validate` to validate that the `openapi.json` file is up-to-date.

The `next-rest-framework validate` command is useful to have as part of the static checks in your CI/CD pipeline. Both commands support the following options:

| Name                    | Description                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--skipBuild <boolean>` | By default, `next build` is used to build your routes. If you have already created the build, you can skip this step by setting this to `true`.                                                |
| `--distDir <string>`    | Path to your production build directory. Defaults to `.next`.                                                                                                                                  |
| `--timeout <string>`    | The timeout for generating the OpenAPI spec. Defaults to 60 seconds.                                                                                                                           |
| `--configPath <string>` | In case you have multiple docs handlers with different configurations, you can specify which configuration you want to use by providing the path to the API. Example: `/api/my-configuration`. |
| `--debug <boolean>`     | Inherit and display logs from the `next build` command. Defaults to `false`.                                                                                                                   |

## [Changelog](#changelog)

See the changelog in [CHANGELOG.md](https://github.com/blomqma/next-rest-framework/blob/main/CHANGELOG.md)

## [Contributing](#contributing)

All contributions are welcome!

## [License](#license)

ISC, see full license in [LICENSE](https://github.com/blomqma/next-rest-framework/blob/main/LICENCE).
