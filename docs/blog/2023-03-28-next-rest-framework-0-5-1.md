---
slug: next-rest-framework-0-5-1
title: Next REST Framework 0.5.1
authors: blomqma
tags: [Next.js, REST, API, TypeScript, object-schema validation, OpenAPI]
---

With the help of the early community of Next REST Framework, we've made the framework significantly more robust for production use serving better developer needs during the past weeks. Some examples of this are the awesome new features like validating query parameters and adding support for an auto-generated local OpenAPI specification.

### Query parameter validation

You can now validate also query parameters with [Zod](https://zod.dev/) and [Yup](https://github.com/jquense/yup) schemas in addition to validating only the request bodies simply by passing the validation schema to your input object:

```typescript
// src/pages/api/todos.ts

import { defineEndpoints } from 'next-rest-framework/client';
import { z } from 'zod';

export default defineEndpoints({
  POST: {
    input: {
      // ...
      query: z.object({
        page: z.string()
      })
    }
    // Rest of your logic.
  }
});
```

This way all requests with query parameters not matching to the provided schema will get an error response. In addition to this, the query parameter definition is now also included into the generated OpenAPI spec!

### Local OpenAPI spec

To avoid unnecessary filesystem calls and prefer caching, Next REST Framework now relies on a local `openapi.json` file that will contain your auto-generated OpenAPI spec. This addition also makes the framework usable in serverless environments like Vercel and allows you to use the generated OpenAPI spec for whatever purposes you want to.

The `openapi.json` file will be regenerated during local development whenever you call any of the reserved OpenAPI paths:

- `/api`
- `/api/openapi.json`
- `/api/openapi.yaml`

Additionally, we've fixed a list of issues brought up by the community and improved the stability of the framework all together.
