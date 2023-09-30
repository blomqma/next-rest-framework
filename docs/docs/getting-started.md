---
sidebar_position: 2
---

# Getting started

### [Initialize client](#initialize-client)

To use Next REST Framework you need to initialize the client somewhere in your Next.js project. The client exposes all functionality of the framework you will need:

App Router:

```typescript
// src/next-rest-framework/client.ts

import { NextRestFramework } from 'next-rest-framework';

export const { defineCatchAllRoute, defineRoute } = NextRestFramework({
  appDirPath: 'src/app', // Path to your app directory.
  deniedPaths: ['/api/auth/**'] // Paths that are not using Next REST Framework if you have any.
});
```

Pages Router:

```typescript
// src/next-rest-framework/client.ts

import { NextRestFramework } from 'next-rest-framework';

export const { defineCatchAllApiRoute, defineApiRoute } = NextRestFramework({
  apiRoutesPath: 'src/pages/api', // Path to your API routes directory.
  deniedPaths: ['/api/auth/**'] // Paths that are not using Next REST Framework if you have any.
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

export const GET = defineCatchAllRoute();
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
// src/app/api/todos.ts

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
    // A strongly-typed Route Handler: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
    handler: async (req) => {
      const { foo, bar } = await req.json();

      // Any other JSON format will lead to TS error.
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

import { defineApiRoute } from 'next-rest-framework/client';
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

These type-safe endpoints will be now auto-generated to your OpenAPI spec and Swagger UI!

![Next REST Framework Swagger UI](@site/static/img/swagger-ui-screenshot.jpg)
