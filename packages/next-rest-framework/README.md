<p align="center">
  <br/>
  <img width="250px" src="https://raw.githubusercontent.com/blomqma/next-rest-framework/d02224b38d07ede85257b22ed50159a947681f99/packages/next-rest-framework/logo.svg" />
  <h2 align="center">Next REST Framework</h3>
  <p align="center">Type-safe, self-documenting REST APIs for Next.js</p>
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
    - [App Router:](#app-router-1)
    - [Pages Router:](#pages-router-1)
- [API reference](#api-reference)
  - [Docs handler options](#docs-handler-options)
  - [Docs config](#docs-config)
  - [Route handler options](#route-handler-options)
  - [Route operations](#route-operations)
    - [Input](#input)
    - [Output](#output)
    - [Handler](#handler)
- [CLI](#cli)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## [Overview](#overview)

Next REST Framework is an open-source, opinionated, lightweight, easy-to-use set of tools to build type-safe, self-documenting HTTP REST APIs with [Next.js](http://nextjs.org/). Building OpenAPI specification-compliant REST APIs can be cumbersome and slow but Next REST Framework makes this easy with auto-generated OpenAPI documents and docs using TypeScript and object schemas.

- [Live demo](https://next-rest-framework-demo.vercel.app)
- [Docs](https://next-rest-framework.vercel.app)

This is a monorepo containing the following packages / projects:

1. The primary `next-rest-framework` package
2. An example application for live demo and local development

## [Features](#features)

### Lightweight, type-safe, easy to use

- Designed to work with TypeScript so that your requests and responses are strongly typed.
- Object-schema validation with [Zod](https://github.com/colinhacks/zod). The object schemas are automatically converted to JSON schema format for the auto-generated OpenAPI specification.
- Auto-generated and extensible `openapi.json` spec file from your business logic.
- Auto-generated [Redoc](https://github.com/Redocly/redoc) and/or [SwaggerUI](https://swagger.io/tools/swagger-ui/) documentation frontend.
- Works with Next.js [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) and other server-side libraries, like [NextAuth.js](#https://github.com/nextauthjs/next-auth).
- Supports both Next.js [App Router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [Pages Router](https://nextjs.org/docs/pages/building-your-application/routing), even at the same time.
- Fully customizable and compatible with any existing Next.js project.

## [Installation](#installation)

```
npm install --save next-rest-framework
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
| `autoGenerateOpenApiSpec` | Setting this to `false` will not automatically update the generated OpenAPI spec when calling the Next REST Framework endpoint. Defaults to `true`.                                                                                                                                                                    |
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

### [Route handler options](#route-handler-options)

The following options cam be passed to the `routeHandler` (App Router) and `apiRouteHandler` (Pages Router) functions to create new API endpoints:

| Name                                                       | Description                                                                                                                                                 | Required |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH` | A [Method handler](#method-handlers) object.                                                                                                                | `true`   |
| `openApiPath`                                              | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification. | `false`  |

### [Route operations](#route-operations)

The route operation functions `routeOperation` (App Router) and `apiRouteOperation` (Pages Router) allow you to define your API handlers for your endpoints. These functions accept an OpenAPI [Operation object](https://swagger.io/specification/#operation-object) as a parameter, that can be used to override the auto-generated specification. Calling this function allows you to chain your API handler logic with the following functions.

| Name      | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `input`   | An [Input](#input) function for defining the validation and documentation of the request.    |
| `output`  | An [Output](#output) function for defining the validation and documentation of the response. |
| `handler` | A [Handler](#handler) function for defining your business logic.                             |

#### [Input](#input)

The input function is used for validation and documentation of the request, taking in an object with the following properties:

| Name          | Description                                                                                                                                           | Required |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type header of the request. When the content type is defined, a request with an incorrect content type header will get an error response. | `false`  |
| `body`        | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the request body.                                                          | `false`  |
| `query`       | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the query parameters.                                                      | `false`  |

Calling the input function allows you to chain your API handler logic with the [Output](#output) and [Handler](#handler) functions.

#### [Output](#output)

The output function is used for validation and documentation of the response, taking in an array of objects with the following properties:

| Name          | Description                                                                                                                                                       | Required |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `status`      | A status code that your API can return.                                                                                                                           | `true`   |
| `contentType` | The content type header of the response.                                                                                                                          | `true`   |
| `schema`      | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the response data. A response body not matching to the schema will lead to a TS error. |  `true`  |

Calling the input function allows you to chain your API handler logic with the [Handler](#handler) function.

#### [Handler](#handler)

The handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly-typed versions of the same parameters as the Next.js [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers.

## [CLI](#cli)

The Next REST Framework CLI supports generating and validating the `openapi.json` file:

- `npx next-rest-framework generate` to generate the `openapi.json` file.
- `npx next-rest-framework validate` to validate that the generated OpenAPI spec matches the previously generated `openapi.json` file.

The `next-rest-framework validate` command is useful to have as part of the static checks in your CI/CD pipeline. Both commands support the following options:

| Name                    | Description                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--skipBuild <boolean>` | By default this command runs `next build` to build your routes. If you have already created the build, you can skip this step by setting this to `true`.                                       |
| `--distDir <string>`    | Path to your production build directory. Defaults to `.next`.                                                                                                                                  |
| `--timeout <string>`    | The timeout for generating the OpenAPI spec. Defaults to 60 seconds.                                                                                                                           |
| `--configPath <string>` | In case you have multiple docs handlers with different configurations, you can specify which configuration you want to use by providing the path to the API. Example: `/api/my-configuration`. |

## [Changelog](#changelog)

See the changelog in [CHANGELOG.md](https://github.com/blomqma/next-rest-framework/blob/main/CHANGELOG.md)

## [Contributing](#contributing)

All contributions are welcome!

## [License](#license)

ISC, see full license in [LICENSE](https://github.com/blomqma/next-rest-framework/blob/main/LICENCE).
