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
  - [Initialize catch-all handler](#initialize-catch-all-handler)
  - [Add an API Route](#add-an-api-route)
- [Config options](#config-options)
- [Route config](#route-config)
  - [Method handlers](#method-handlers)
    - [Input](#input)
    - [Output object](#output-object)
    - [Handler](#handler)
- [Middlewares](#middlewares)
  - [Global middleware](#global-middleware)
  - [Route middleware](#route-middleware)
  - [Method middleware](#method-middleware)
- [Error handlers](#error-handlers)
  - [Global error handler](#global-error-handler)
  - [Route error handler](#route-error-handler)
  - [Method error handler](#method-error-handler)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## [Overview](#overview)

Next REST Framework is an open-source, opinionated, lightweight, easy-to-use set of tools to build type-safe, self-documenting HTTP REST APIs with [Next.js](http://nextjs.org/). Building OpenAPI specification-compliant REST APIs can be cumbersome and slow but Next REST Framework makes this easy with auto-generated OpenAPI documents and Swagger UI using TypeScript and object schemas.

This is a monorepo containing the following packages / projects:

1. The primary `next-rest-framework` package
2. A development test application

## [Features](#features)

### Lightweight, type-safe, easy to use

- Designed to work with TypeScript so that your request bodies, responses, headers etc. are strongly typed.
- Object-schema validation with popular libraries like [Zod](https://github.com/colinhacks/zod) or [Yup](https://github.com/jquense/yup). These schemas are automatically converted to JSON schema format for the auto-generated OpenAPI specifications.
- Supports auto-generated openapi.json and openapi.yaml documents for which you can include your existing OpenAPI specification.
- Supports any kind of middleware logic that you want to use for authentication etc. See more in [Middlewares](#middlewares). Also works with other Next.js server-side libraries, like [NextAuth.js](#https://github.com/nextauthjs/next-auth).
- Fully customizable - You can decide which routes Next REST Framework will use to serve your API docs etc. and it can be easily customized to work with any kind of existing Next.js REST API.

## [Installation](#installation)

```
npm install --save next-rest-framework
```

## [Getting started](#getting-started)

### [Initialize client](#initialize-client)

To use Next REST Framework you need to initialize the client somewhere in your Next.js project. The client exposes all functionality of the framework you will need:

```typescript
// next-rest-framework/client.ts

import { NextRestFramework } from 'next-rest-framework';

export const { defineCatchAllHandler, defineEndpoints } = NextRestFramework();
```

The complete API of the initialized client is the following:

| Name                    | Description                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineCatchAllHandler` |  A function used to generate your single catch-all API route. Must be used in the root of your API routes folder in the following path `pages/api/[[...next-rest-framework]].ts`. |
| `defineEndpoints`       | Used for all other API routes that you want to use Next REST Framework for. Can also be used in other catch-all API routes.                                                       |

### [Initialize catch-all handler](#initialize-catch-all-handler)

To initialize Next REST Framework you need to export and call the `defineCatchAllHandler` function from a root-level [optional catch-all API route](https://nextjs.org/docs/routing/dynamic-routes#optional-catch-all-routes):

```typescript
// pages/api/[[...next-rest-framework]].ts

import { defineCatchAllHandler } from 'next-rest-framework/client';

export default defineCatchAllHandler();
```

This is enough to get you started. By default Next REST Framework gives you three API routes with this configuration:

- `/api`: Swagger UI using the auto-generated OpenAPI spec.
- `/api/openapi.json`: An auto-generated openapi.json document.
- `/api/openapi.yaml`: An auto-generated openapi.yaml document.

All of these are configurable with the [Config options](#config-options) that you can pass for your `NextRestFramework` client. You can also use your existing catch-all logic simply by passing a [Route config](#route-config) to your `defineCatchAllHandler` if you want to use e.g. custom 404 handlers, redirections etc.

### [Add an API Route](#add-an-api-route)

```typescript
// pages/api/todos.ts

import { defineEndpoints } from 'next-rest-framework/client';
import { z } from 'zod';

const todoSchema = z.object({
  id: z.string(),
  name: z.string(),
  completed: z.boolean()
});

export default defineEndpoints({
  GET: {
    output: [
      {
        status: 200,
        contentType: 'application/json',
        schema: z.array(todoSchema)
      }
    ],
    handler: ({ res }) => {
      // Any other content type will lead to TS error.
      res.setHeader('content-type', 'application/json');

      // Any other status or JSON format will lead to TS error.
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
      query: {
        page: z.number()
      }
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: todoSchema
      }
    ],
    handler: ({
      res,
      req: {
        body: {
          name // Any other attribute will lead to TS error.
        },
        query: {
          page // Any other attribute will lead to TS error.
        }
      }
    }) => {
      // Any other content type will lead to TS error.
      res.setHeader('content-type', 'application/json');

      // Any other status or JSON format will lead to TS error.
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

## [Config options](#config-options)

The optional config options allow you to customize Next REST Framework. The following options can be passed as a parameter for your `NextRestFramework` client in an object:

| Name                | Description                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openApiSpec`       | An [OpenAPI Object](https://swagger.io/specification/#openapi-object) that can be used to override and extend the auto-generated specification.          |
| `openApiJsonPath`   | Custom path for serving `openapi.json` file. Defaults to `/api/openapi.json`.                                                                            |
| `openApiYamlPath`   | Custom path for serving `openapi.yaml` file. Defaults to `/api/openapi.yaml`.                                                                            |
| `swaggerUiPath`     | Custom path for service Swagger UI. Defaults to `/api`.                                                                                                  |
| `exposeOpenApiSpec` | Setting this to `false` will serve none of the OpenAPI documents neither the Swagger UI. Defaults to `true`.                                             |
| `middleware`        | A global middleware for all of your API routes. See [Global middleware](#global-middleware) for more information.                                        |
| `errorHandler`      | A [Global error handler](#global-error-handler) for all of your API routes. Defaults to a basic error handler logging the errors in non-production mode. |
| `suppressInfo`      | Setting this to `true` will suppress all informational logs from Next REST Framework. Defaults to `false`.                                               |

## [Route config](#route-config)

The route config parameters define an individual route, applicable for all endpoints (methods) that are using that route:

| Name                                                                | Description                                                                                                                                                                   | Required |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH \| TRACE` | A [Method handler](#method-handlers) object.                                                                                                                                  | `true`   |
| `middleware`                                                        |  A [Middleware](#middlewares) function that takes in the return values from your [Global middleware](#global-middleware).                                                     | `false`  |
| `errorHandler`                                                      | A [Route error handler](#route-error-handler) for this API route, overriding the [Global error handler](#global-error-handler).                                               | `false`  |
| `openApiSpec`                                                       | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated and higher level specifications. | `false`  |

### [Method handlers](#method-handlers)

The method handler parameters define an individual endpoint:

| Name           | Description                                                                                                                                                                         | Required |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `input`        | An [Input object](#input-object) object.                                                                                                                                            | `false`  |
| `output`       | An array of [Output objects](#output-object).                                                                                                                                       |  `true`  |
| `middleware`   | A [Middleware](#middlewares) function that takes in the return values from both your [Global middleware](#global-middleware) and [Route middleware](#route-middleware).             |  `false` |
| `handler`      |  Your [Handler](#handler) function that takes in your typed request, response and [Middleware](#middlewares) parameters and contains all of your business logic.                    | `true`   |
| `errorHandler` | A [Method error handler](#method-error-handler) for this method, overriding both the [Global error handler](#global-error-handler) and [Route error handler](#route-error-handler). | `false`  |
| `openApiSpec`  | An OpenAPI [Operation object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated and higher level specifications.       | `false`  |

#### [Input](#input-object)

The input object is used for the validation of the incoming request:

| Name          | Description                                                                                                                               | Required |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type that the request must have - request with no content type or incorrect content type will get an error response.          | `true`   |
| `body`        | A [Zod](https://github.com/colinhacks/zod) or [Yup](https://github.com/jquense/yup) schema describing the format of the request body.     | `true`   |
| `query`       | A [Zod](https://github.com/colinhacks/zod) or [Yup](https://github.com/jquense/yup) schema describing the format of the query parameters. | `false`  |

#### [Output object](#output-object)

The output objects define what kind of responses you are allowed to return from your API handlers:

| Name          | Description                                                                                                                                                                                                  | Required |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `status`      | A possible status code that your API can return - using other status codes will lead to a TS error.                                                                                                          | `true`   |
| `contentType` | The content type of the response - using other content-types will lead to a TS error.                                                                                                                        | `true`   |
| `schema`      | A [Zod](https://github.com/colinhacks/zod) or [Yup](https://github.com/jquense/yup) schema describing the format of the response data. A response format not matching to the schema will lead to a TS error. |  `true`  |

#### [Handler](#handler)

The handler function takes care of your actual business logic, supporting both synchronous and asynchronous execution and taking in an object with three strongly typed parameters:

| Name     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`    |  A strongly-typed `NextApiRequest` object containing the typed body and query parameters of your request.                                                                                                                                                                                                                                                                                                                                                                    |
| `res`    | A strongly-typed `NextApiResponse` object that allows you to use only pre-defined status codes, `Content-Type` headers and response data formats from the current method handler.                                                                                                                                                                                                                                                                                            |
| `params` | An object containing the strongly-typed combined response of your [Global middleware](#global-middleware), [Route middleware](#route-middleware) and [Method middleware](#method-middleware). The parameters can also be overridden in the different middleware layers with the [Method middleware](#method-middleware) taking precedence over the [Route middleware](#route-middleware) and route middleware taking precedence over [Global middleware](#global-middleware) |

## [Middlewares](#middlewares)

The middleware functions can be used for any kind of middleware logic, like adding authentication etc. for your API. In addition, they can be used to add additional typed parameters for your API route handlers. They support both asynchronous and synchronous execution.

```typescript
// A global middleware, route middleware or method middleware.
middleware: () => ({
  foo: 'bar'
});
// A method handler (given that the middleware above is either in the same API route or method, or is a global middleware).
handler: ({
  params: {
    foo // string
  }
}) => {
  // Your logic.
};
```

### [Global middleware](#global-middleware)

The global middleware function takes in an object with two attributes and optionally returns an object of any form:

| Name  | Description                       |
| ----- | --------------------------------- |
| `req` |  A plain `NextApiRequest` object. |
| `res` | A plain `NextApiResponse` object. |

### [Route middleware](#route-middleware)

The route middleware function takes in an object with three attributes and optionally returns an object of any form:

| Name     | Description                                                                      |
| -------- | -------------------------------------------------------------------------------- |
| `req`    |  A plain `NextApiRequest` object.                                                |
| `res`    | A plain `NextApiResponse` object.                                                |
| `params` |  The type of an object returned by your [Global middleware](#global-middleware). |

### [Method middleware](#method-middleware)

The method middleware function takes in an object with three attributes and optionally returns an object of any form:

| Name     | Description                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`    |  A strongly-typed `NextApiRequest` object containing the typed body and query parameters of your request.                                                                         |
| `res`    | A strongly-typed `NextApiResponse` object that allows you to use only pre-defined status codes, `Content-Type` headers and response data formats from the current method handler. |
| `params` |  The type of a combined object returned by both your [Global middleware](#global-middleware) and [Route middleware](#route-middleware).                                           |

## [Error handlers](#error-handlers)

The error handler functions can be used for custom error handling. They support both asynchronous and synchronous execution.

```typescript
// A global error handler, route error handler or method error handler.
errorHandler: ({ req, res, params }) => {
  // Your error handling logic.
};
```

### [Global error handler](#global-error-handler)

The global error handler takes in an object with two attributes:

| Name  | Description                       |
| ----- | --------------------------------- |
| `req` |  A plain `NextApiRequest` object. |
| `res` | A plain `NextApiResponse` object. |

### [Route error handler](#global-error-handler)

Route error handler can be used to override your global error handler. The route error handler takes in an object with three attributes:

| Name     | Description                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `req`    |  A plain `NextApiRequest` object.                                                                                                       |
| `res`    | A plain `NextApiResponse` object.                                                                                                       |
| `params` |  The type of a combined object returned by both your [Global middleware](#global-middleware) and [Route middleware](#route-middleware). |

### [Method error handler](#global-error-handler)

Method error handler can be used to override both your global error handler and route error handler. The method error handler takes in an object with three attributes and optionally returns an object of any form:

| Name     | Description                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`    |  A strongly-typed `NextApiRequest` object containing the typed body and query parameters of your request.                                                                         |
| `res`    | A strongly-typed `NextApiResponse` object that allows you to use only pre-defined status codes, `Content-Type` headers and response data formats from the current method handler. |
| `params` |  The type of a combined object returned by your [Global middleware](#global-middleware), [Route middleware](#route-middleware) and [Method middleware](#method-middleware).       |

## [Changelog](#changelog)

See the changelog in [CHANGELOG.md](https://github.com/blomqma/next-rest-framework/blob/main/CHANGELOG.md)

## [Contributing](#contributing)

All contributions are welcome!

## [License](#license)

ISC, see full license in [LICENSE](https://github.com/blomqma/next-rest-framework/blob/main/LICENCE).
