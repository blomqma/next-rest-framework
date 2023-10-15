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
  - [Initialize docs endpoint](#initialize-docs-endpoint)
    - [App Router:](#app-router)
    - [Pages Router:](#pages-router)
  - [Add a route](#add-a-route)
    - [App Router:](#app-router-1)
    - [Pages Router:](#pages-router-1)
- [API reference](#api-reference)
  - [Config options](#config-options)
  - [Route config](#route-config)
    - [Method handlers](#method-handlers)
      - [Input object](#input-object)
      - [Output object](#output-object)
  - [Docs config](#docs-config)
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

### [Initialize docs endpoint](#initialize-docs-endpoint)

To get access to the auto-generated documentation, initialize the docs endpoint somewhere in your codebase. You can also skip this step if you don't want to expose a public API documentation.

#### App Router:

```typescript
// src/app/api/route.ts

import { defineDocsRoute } from 'next-rest-framework';

export const GET = defineDocsRoute();
```

#### Pages Router:

```typescript
// src/pages/api.ts

import { defineDocsApiRoute } from 'next-rest-framework';

export default defineDocsApiRoute();
```

This is enough to get you started. Now you can access the API documentation in your browser. Calling this endpoint will automatically generate the `openapi.json` OpenAPI specification file, located in the `public` folder by default. You can also configure this endpoint to disable the automatic generation of the OpenAPI spec file or use the CLI command `npx next-rest-framework generate` to generate it. You can also use both App Router and Pages Router simultaneously by combining the examples above. See the full configuration options of this endpoint in the [Config options](#config-options) section.

### [Add a route](#add-a-route)

#### App Router:

```typescript
// src/app/api/todos/route.ts

import { defineRoute } from 'next-rest-framework';
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
      })
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: z.object({
          foo: z.string(),
          bar: z.number()
        })
      }
    ],
    handler: async (req) => {
      const { foo, bar } = await req.json();

      return NextResponse.json(
        { foo, bar },
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

import { defineApiRoute } from 'next-rest-framework';
import { z } from 'zod';

export default defineApiRoute({
  GET: {
    output: [
      {
        status: 200,
        contentType: 'application/json',
        schema: z.object({
          foo: z.string(),
          bar: z.string(),
          baz: z.string(),
          qux: z.string()
        })
      }
    ],
    handler: (_req, res) => {
      res.status(200).json({ foo: 'foo', bar: 'bar', baz: 'baz', qux: 'qux' });
    }
  },
  POST: {
    input: {
      contentType: 'application/json',
      body: z.object({
        foo: z.string(),
        bar: z.number()
      })
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: z.object({
          foo: z.string(),
          bar: z.number()
        })
      }
    ],
    handler: ({ body: { foo, bar } }, res) => {
      res.status(201).json({ foo, bar });
    }
  }
});
```

These type-safe endpoints will be now auto-generated to your OpenAPI spec!

![Next REST Framework docs](./docs/static/img/docs-screenshot.jpg)

## [API reference](#api-reference)

### [Config options](#config-options)

The optional config options allow you to customize Next REST Framework. The following options can be passed to the `defineDocsRoute` (App Router) and `defineDocsApiRoute` (Pages Router) docs route handler functions:

| Name                      | Description                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deniedPaths`             | Array of paths that are denied by Next REST Framework and not included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/disallowed-path', '/api/disallowed-path-2/*', '/api/disallowed-path-3/**']` Defaults to no paths being disallowed. |
| `allowedPaths`            | Array of paths that are allowed by Next REST Framework and included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/allowed-path', '/api/allowed-path-2/*', '/api/allowed-path-3/**']` Defaults to all paths being allowed.               |
| `openApiSpecOverrides`    | Overrides to the generated OpenAPI spec.                                                                                                                                                                                                                                                                               |
| `openApiJsonPath`         | Path that will be used for fetching the OpenAPI spec - defaults to `/openapi.json`. This path also determines the path where this file will be generated inside the `public` folder.                                                                                                                                   |
| `autoGenerateOpenApiSpec` | Setting this to `false` will not automatically update the generated OpenAPI spec when calling the Next REST Framework endpoint. Defaults to `true`.                                                                                                                                                                    |
| `docsConfig`              | A [Docs config](#docs-config) object for customizing the generated docs.                                                                                                                                                                                                                                               |
| `suppressInfo`            | Setting this to `true` will suppress all informational logs from Next REST Framework. Defaults to `false`.                                                                                                                                                                                                             |
| `generatePathsTimeout`    | Timeout in milliseconds for generating the OpenAPI spec. Defaults to 5000. For large applications you might have to increase this.                                                                                                                                                                                     |

### [Route config](#route-config)

The route config parameters passed to the `defineRoute` (App Router) and `defineApiRoute` (Pages Router) functions define an individual route, applicable for all endpoints that are using that route:

| Name                                                       | Description                                                                                                                                                                   | Required |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH` | A [Method handler](#method-handlers) object.                                                                                                                                  | `true`   |
| `openApiSpecOverrides`                                     | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated and higher level specifications. | `false`  |

#### [Method handlers](#method-handlers)

The method handler parameters define an individual endpoint:

| Name                   | Description                                                                                                                                                                                                                                                                                                                               | Required |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `input`                | An [Input object](#input-object) object.                                                                                                                                                                                                                                                                                                  | `false`  |
| `output`               | An array of [Output objects](#output-object).                                                                                                                                                                                                                                                                                             |  `true`  |
| `handler`              | A strongly-typed handler function for your API. The function takes in strongly-typed versions of the same parameters as the Next.js [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers. | `true`   |
| `openApiSpecOverrides` | An OpenAPI [Operation object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated and higher level specifications.                                                                                                                                                             | `false`  |

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

### [Docs config](#docs-config)

The docs config object can be used to customize the generated docs:

| Name          | Description                             |
| ------------- | --------------------------------------- |
| `title`       | Custom page title meta tag value.       |
| `description` | Custom page description meta tag value. |
| `faviconUrl`  | A URL for a custom favicon.             |
| `logoUrl`     | A URL for a custom logo.                |

## [Changelog](#changelog)

See the changelog in [CHANGELOG.md](https://github.com/blomqma/next-rest-framework/blob/main/CHANGELOG.md)

## [Contributing](#contributing)

All contributions are welcome!

## [License](#license)

ISC, see full license in [LICENSE](https://github.com/blomqma/next-rest-framework/blob/main/LICENCE).
