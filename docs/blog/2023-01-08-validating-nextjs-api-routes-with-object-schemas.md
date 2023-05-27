---
slug: validating-nextjs-api-routes-with-object-schemas
title: Validating Next.js API routes with object schemas
authors: blomqma
tags: [Next.js, API routes, object schemas, Zod, validation, TypeScript]
---

Next.js [API routes](https://nextjs.org/docs/api-routes/introduction) offer a nice way to define HTTP REST endpoints for your Next.js backend. The TypeScript support is also there, even though by default, your requests are untyped. Instead of casting your request to certain types, we first need to validate the requests to achieve full type-safety with TypeScript.

Luckily, [Next REST Framework](https://github.com/blomqma/next-rest-framework) does all of this out-of-the-box for us. Let's start by creating an example Next.js application:

```
npx create-next-app@latest --typescript
# or
yarn create next-app --typescript
# or
pnpm create next-app --typescript
```

Next, let's add Next REST Framework as a dependency with our object schema validation library [Zod](https://github.com/colinhacks/zod):

```
yarn add next-rest-framework zod
# or
pnpm i next-rest-framework zod
```

Now we're done with our dependencies and we can run our project on `http://localhost:3000`:

```
yarn dev
# or
pnpm dev
```

Now we can initialize our Next REST Framework client and define out first API:

```typescript
// next-rest-framework/client.ts

import { NextRestFramework } from 'next-rest-framework';

export const { defineEndpoints } = NextRestFramework();
```

```typescript
// pages/api/todos.ts

import { defineEndpoints } from 'next-rest-framework/client';

export default defineEndpoints({
  POST: {
    handler: ({
      res,
      req: {
        body: { name }
      }
    }) => {
      res.status(201).json({
        id: 'foo',
        name,
        completed: false
      });
    }
  }
});
```

Now our API route has been defined and we can see that making a POST request to our `http://localhost:300/api/todos` will return our desired response. However our request is still untyped and not validated so let's add a Zod schema that will both add types for our request body and validate it:

```typescript
// pages/api/todos.ts

import { defineEndpoints } from 'next-rest-framework/client';

export default defineEndpoints({
  POST: {
    input: {
      contentType: 'application/json',
      schema: z.object({
        name: z.string()
      })
    },
    handler: ({
      res,
      req: {
        body: {
          name // Any other attribute will lead to TS error.
        }
      }
    }) => {
      res.status(201).json({
        id: 'foo',
        name,
        completed: false
      });
    }
  }
});
```

Nice, now or request body is fully typed and making a request with a body not conforming with our `input` schema and content type will get an error response. To make our endpoint even more type-safe, let's also type our responses:

```typescript
// pages/api/todos.ts

import { defineEndpoints } from 'next-rest-framework/client';

export default defineEndpoints({
  POST: {
    input: {
      contentType: 'application/json',
      schema: z.object({
        name: z.string()
      })
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: z.object({
          id: z.string(),
          name: z.string(),
          completed: z.boolean()
        })
      }
    ],
    handler: ({
      res,
      req: {
        body: { name }
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

That's it, now we have fully typed and validated both the inputs and outputs from our endpoint.

### Bonus

To see real-time documentation for our endpoint, let's navigate to `http//localhost:3000/api` and see it in action:

![Next REST Framework Swagger UI](@site/static/img/blog-2023-01-08-openapi-spec.jpg)
