# JSON, Form Data, and Typed Responses

## Schema Rule by Content Type

- `application/json`: use Zod schemas.
- `application/x-www-form-urlencoded`: use `zod-form-data` schemas.
- `multipart/form-data`: use `zod-form-data` schemas, and add `bodySchema` for file/binary docs when needed.

## Shared Form Schemas

```ts
import { zfd } from 'zod-form-data';

export const formSchema = zfd.formData({
  text: zfd.text()
});

export const multipartFormSchema = zfd.formData({
  text: zfd.text(),
  file: zfd.file()
});
```

## App Router Form Example

```ts
import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { multipartFormSchema } from '@/utils';
import { z } from 'zod';

export const { POST } = route({
  uploadFile: routeOperation({ method: 'POST' })
    .input({
      contentType: 'multipart/form-data',
      body: multipartFormSchema,
      bodySchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          file: { type: 'string', format: 'binary' }
        }
      }
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/octet-stream',
        body: z.custom<File>(),
        bodySchema: { type: 'string', format: 'binary' }
      }
    ])
    .handler(async (req) => {
      const formData = await req.formData();
      const file = formData.get('file');
      return new TypedNextResponse(file, {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' }
      });
    })
});
```

## Pages Router Multipart Requirement

```ts
export const config = {
  api: { bodyParser: false }
};
```

Without this config, `multipart/form-data` parsing can fail in Pages Router.

## `TypedNextResponse` Usage

- Prefer `TypedNextResponse.json(...)` in App Router handlers when you want status/content-type to be checked against `outputs`.
- Use `new TypedNextResponse(...)` for non-JSON responses (HTML, binary file streams).
