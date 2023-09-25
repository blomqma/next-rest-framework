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
    <a href="https://packagephobia.com/result?p=next-rest-framework">
      <img src="https://packagephobia.com/badge?p=next-rest-framework" alt="Bundle Size"/>
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
  - [Initialize client](#initialize-client)
  - [Initialize catch-all route](#initialize-catch-all-route)
  - [Add an API Route](#add-an-api-route)
    - [App Router:](#app-router)
    - [Pages Router:](#pages-router)
- [API reference](#api-reference)
  - [Config options](#config-options)
  - [Route config](#route-config)
    - [Method handlers](#method-handlers)
      - [Input object](#input-object)
      - [Output object](#output-object)
  - [SwaggerUI config](#swaggerui-config)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## [Overview](#overview)

Next REST Framework is an open-source, opinionated, lightweight, easy-to-use set of tools to build type-safe, self-documenting HTTP REST APIs with [Next.js](http://nextjs.org/). Building OpenAPI specification-compliant REST APIs can be cumbersome and slow but Next REST Framework makes this easy with auto-generated OpenAPI documents and Swagger UI using TypeScript and object schemas.

- [Live demo](https://next-rest-framework-demo.vercel.app/api)
- [Docs](https://next-rest-framework.vercel.app)

This is a monorepo containing the following packages / projects:

1. The primary `next-rest-framework` package
2. An example application for live demo and local development

## [Features](#features)

### Lightweight, type-safe, easy to use

- Designed to work with TypeScript so that your request bodies, responses, headers etc. are strongly typed.
- Object-schema validation with [Zod](https://github.com/colinhacks/zod). The schemas are automatically converted to JSON schema format for the auto-generated OpenAPI specifications.
- Supports auto-generated openapi.json and openapi.yaml documents for which you can include your existing OpenAPI specification.
- Works with Next.js [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) and other server-side libraries, like [NextAuth.js](#https://github.com/nextauthjs/next-auth).
- Supports both Next.js [App Router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [Pages Router](https://nextjs.org/docs/pages/building-your-application/routing), even at the same time.
- Fully customizable - You can decide which routes Next REST Framework will use to serve your API docs etc. and it can be easily customized to work with any kind of existing Next.js REST API.

## [Installation](#installation)

```
npm install --save next-rest-framework
```

## [Getting started](#getting-started)

### [Initialize client](#initialize-client)

To use Next REST Framework you need to initialize the client somewhere in your Next.js project. The client exposes all functionality of the framework you will need:

App Router:

```typescript
// src/next-rest-framework/client.ts

import { NextRestFramework } from 'next-rest-framework';

export const { defineCatchAllRoute, defineRoute } = NextRestFramework({
  appDirPath: 'src/app' // Path to your app directory.
});
```

Pages Router:

```typescript
// src/next-rest-framework/client.ts

import { NextRestFramework } from 'next-rest-framework';

export const { defineCatchAllApiRoute, defineApiRoute } = NextRestFramework({
  apiRoutesPath: 'src/pages/api' // Path to your API routes directory.
});
```

You can also use both App Router and Pages Router simultaneously by combining the examples above.

The complete API of the initialized client is the following:

| Name                     | Description                                                                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineCatchAllRoute`    |  A function for defining a single catch-all route when using App Router. Must be used in the root of your `app` directory in the following path `[[...next-rest-framework]]/route.ts`.             |
| `defineCatchAllApiRoute` |  A function for defining a single catch-all API route when using Pages Router. Must be used in the root of your API routes folder in the following path `pages/api/[[...next-rest-framework]].ts`. |
| `defineRoute`            | A function for defining an individual route that you want to use Next REST Framework for when using App Router. Can also be used in other catch-all API routes.                                    |
| `defineApiRoute`         | A function for defining an individual API route that you want to use Next REST Framework for when using Pages Router. Can also be used in other catch-all API routes.                              |

### [Initialize catch-all route](#initialize-catch-all-route)

To initialize Next REST Framework you need to export and call the `defineCatchAllRoute` function when using App Router, or `defineCatchAllApiRoute` function when using Pages Router from a root-level [optional catch-all API route](https://nextjs.org/docs/routing/dynamic-routes#optional-catch-all-routes):

```typescript
// src/app/[[...next-rest-framework]]/route.ts

import { defineCatchAllRoute } from 'next-rest-framework/client';

export default defineCatchAllRoute();
```

OR:

```typescript
// src/pages/api/[[...next-rest-framework]].ts

import { defineCatchAllApiRoute } from 'next-rest-framework/client';

export default defineCatchAllApiRoute();
```

This is enough to get you started. Your application should use the catch-all function only once. If you want to define additional catch-all routes, you can use the `defineRoute` or `defineApiRoute` functions for those. By default Next REST Framework gives you three API routes with this configuration:

- `/api`: Swagger UI using the auto-generated OpenAPI spec.
- `/api/openapi.json`: An auto-generated openapi.json document.
- `/api/openapi.yaml`: An auto-generated openapi.yaml document.
- A local `openapi.json` file that will be generated as you run `npx next-rest-framework generate` or call any of the above endpoints in development mode. This file should be under version control and you should always keep it in the project root. It will be automatically updated as you develop your application locally and is used by Next REST Framework when you run your application in production. Remember that it will be dynamically regenerated every time you call any of the above endpoints in development mode. A good practice is also to generate this file as part of your pre-commit hooks or before deploying your changes to production with `next-rest-framework generate`.

The reserved OpenAPI paths are configurable with the [Config options](#config-options) that you can pass for your `NextRestFramework` client.

### [Add an API Route](#add-an-api-route)

#### App Router:

```typescript
// src/app/api/todos/route.ts

import { defineRoute } from 'next-rest-framework/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const handler = defineRoute({
  GET: {
    output: [
      {
        status: 200,
        contentType: 'text/html',
        schema: z.object({
          foo: z.string(),
          bar: z.string(),
          baz: z.string(),
          qux: z.string()
        })
      }
    ],
    handler: () => {
      // Any other JSON format will lead to TS error.
      return NextResponse.json(
        { foo: 'foo', bar: 'bar', baz: 'baz', qux: 'qux' },
        {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }
  },
  POST: {
    input: {
      contentType: 'application/json',
      body: z.object({
        foo: z.string(),
        bar: z.number()
      }),
      query: z.object({
        test: z.string()
      })
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: z.object({
          foo: z.string(),
          bar: z.number(),
          query: z.object({
            test: z.string()
          })
        })
      }
    ],
    // A strongly-typed Route Handler: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
    handler: async (
      req,
      {
        params: {
          test // Strongly typed.
        }
      }
    ) => {
      const { foo, bar } = await req.json();

      // Any other JSON format will lead to TS error.
      return NextResponse.json(
        { foo, bar, query: { test } },
        {
          status: 201
        }
      );
    }
  }
});

export { handler as GET, handler as POST };
```

#### Pages Router:

```typescript
// src/pages/api/todos.ts

import { defineApiRoute } from 'next-rest-framework/client';
import { z } from 'zod';

const todoSchema = z.object({
  id: z.string(),
  name: z.string(),
  completed: z.boolean()
});

export default defineApiRoute({
  GET: {
    output: [
      {
        status: 200,
        contentType: 'application/json',
        schema: z.array(todoSchema)
      }
    ],
    handler: ({ res }) => {
      // Any other JSON format will lead to TS error.
      res.status(200).json([
        {
          id: 'foo',
          name: 'bar',
          completed: true
        }
      ]);
    }
  },
  POST: {
    input: {
      contentType: 'application/json',
      body: z.object({
        name: z.string()
      }),
      query: z.object({
        page: z.string()
      })
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: todoSchema
      }
    ],
    // A strongly-typed API route handler: https://nextjs.org/docs/pages/building-your-application/routing/api-routes
    handler: ({
      res,
      req: {
        body: {
          name // Strongly typed.
        },
        query: {
          page // Strongly typed.
        }
      }
    }) => {
      // Any other JSON format will lead to TS error.
      res.status(201).json({
        id: 'foo',
        name,
        completed: false
      });
    }
  }
});
```

These type-safe endpoints will be now auto-generated to your OpenAPI spec and Swagger UI!

![Next REST Framework Swagger UI](./docs/static/img/swagger-ui-screenshot.jpg)

## [API reference](#api-reference)

### [Config options](#config-options)

The optional config options allow you to customize Next REST Framework. The following options can be passed as a parameter for your `NextRestFramework` client in an object:

| Name                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appDirPath`           |  Absolute path to the app directory where your routes are located, usually either `app` or `src/app`. Required when using App Router. Can be used together with `apiRoutesPath`                                                                                                                                                                                                                                                                                  |
| `apiRoutesPath`        |  Absolute path to the directory where your API routes are located, usually `pages/api` or `src/pages/api`. Required when using Pages Router. Can be used together with `appDirPath`.                                                                                                                                                                                                                                                                             |
| `openApiJsonPath`      | Custom path for serving `openapi.json` file. Defaults to `/api/openapi.json`.                                                                                                                                                                                                                                                                                                                                                                                    |
| `openApiYamlPath`      | Custom path for serving `openapi.yaml` file. Defaults to `/api/openapi.yaml`.                                                                                                                                                                                                                                                                                                                                                                                    |
| `swaggerUiPath`        | Custom path for service Swagger UI. Defaults to `/api`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `swaggerUiConfig`      | A [SwaggerUI config](#swaggerui-config) object for customizing the generated SwaggerUI.                                                                                                                                                                                                                                                                                                                                                                          |
| `exposeOpenApiSpec`    | Setting this to `false` will serve none of the OpenAPI documents neither the Swagger UI. Defaults to `true`.                                                                                                                                                                                                                                                                                                                                                     |
| `errorHandler`         | An error handler function used to catch errors in your routes. Both synchronous and asynchronous handlers are supported. The function takes in the same parameters as the Next.js [App Router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers. Defaults to a basic error handler logging the errors in non-production mode. |
| `suppressInfo`         | Setting this to `true` will suppress all informational logs from Next REST Framework. Defaults to `false`.                                                                                                                                                                                                                                                                                                                                                       |
| `generatePathsTimeout` | Timeout in milliseconds for generating the OpenAPI spec. Defaults to 5000. For large applications you might have to increase this.                                                                                                                                                                                                                                                                                                                               |

### [Route config](#route-config)

The route config parameters define an individual route, applicable for all endpoints (methods) that are using that route:

| Name                                                       | Description                                                                                                                                                                   | Required |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH` | A [Method handler](#method-handlers) object.                                                                                                                                  | `true`   |
| `openApiSpecOverrides`                                     | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated and higher level specifications. | `false`  |

#### [Method handlers](#method-handlers)

The method handler parameters define an individual endpoint:

| Name                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                     | Required |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `input`                | An [Input object](#input-object) object.                                                                                                                                                                                                                                                                                                                                                                                                        | `false`  |
| `output`               | An array of [Output objects](#output-object).                                                                                                                                                                                                                                                                                                                                                                                                   |  `true`  |
| `handler`              |  Your handler function that takes in your typed request and response (when using Pages Router). Both synchronous and asynchronous handlers are supported. The function takes in strongly-typed versions of the same parameters as the Next.js [App Router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers. | `true`   |
| `openApiSpecOverrides` | An OpenAPI [Operation object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated and higher level specifications.                                                                                                                                                                                                                                                                   | `false`  |

##### [Input object](#input-object)

The input object is used for the validation and OpenAPI documentation of the incoming request:

| Name          | Description                                                                                                                                  | Required |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type header of the request. A request with no content type header or a incorrect content type header will get an error response. | `true`   |
| `body`        | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the request body.                                                 | `true`   |
| `query`       | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the query parameters.                                             | `false`  |

##### [Output object](#output-object)

The output objects define what kind of responses are returned from your API handler and is used for the OpenAPI documentation of the response:

| Name          | Description                                                                                                                                                       | Required |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `status`      | A status code that your API can return.                                                                                                                           | `true`   |
| `contentType` | The content type header of the response.                                                                                                                          | `true`   |
| `schema`      | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the response data. A response body not matching to the schema will lead to a TS error. |  `true`  |

### [SwaggerUI config](#swaggerui-config)

The SwaggerUI config object can be used to customize the generated Swagger UI:

| Name          | Description                             |
| ------------- | --------------------------------------- |
| `title`       | Custom page title meta tag value.       |
| `description` | Custom page description meta tag value. |
| `logoHref`    | An href for a custom logo.              |
| `faviconHref` | An href for a custom favicon.           |

## [Changelog](#changelog)

See the changelog in [CHANGELOG.md](https://github.com/blomqma/next-rest-framework/blob/main/CHANGELOG.md)

## [Contributing](#contributing)

All contributions are welcome!

## [License](#license)

ISC, see full license in [LICENSE](https://github.com/blomqma/next-rest-framework/blob/main/LICENCE).
