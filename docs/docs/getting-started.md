---
sidebar_position: 2
---

# Getting started

### [Installation](#installation)

```
npm install --save next-rest-framework
```

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

This is enough to get you started. Now you can access the API documentation in your browser. Calling this endpoint will automatically generate the `openapi.json` OpenAPI specification file, located in the `public` folder by default. You can also configure this endpoint to disable the automatic generation of the OpenAPI spec file or use the CLI command `npx next-rest-framework generate` to generate it. You can also use both App Router and Pages Router simultaneously by combining the examples above. See the full configuration options of this endpoint in the [Config options](/docs/api-reference#config-options) section.

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

![Next REST Framework docs](@site/static/img/docs-screenshot.jpg)
