# OpenAPI Customization and CLI Workflows

## OpenAPI Control Points

- Docs handlers (`docsRoute`, `docsApiRoute`):
- `allowedPaths`, `deniedPaths`
- `openApiObject`
- `openApiJsonPath`
- Route handlers (`route`, `apiRoute`, `rpcRoute`, `rpcApiRoute`) second arg:
- `openApiPath`
- Operation builders (`routeOperation`, `apiRouteOperation`, `rpcOperation`):
- `openApiOperation`
- `bodySchema` fallback for request/response schema conversion edge cases

## Targeted OpenAPI Overrides

```ts
import { route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';

export const { GET } = route(
  {
    listInvoices: routeOperation({
      method: 'GET',
      openApiOperation: {
        summary: 'List invoices',
        tags: ['Billing']
      }
    })
      .outputs([
        {
          status: 200,
          contentType: 'application/json',
          body: z.array(z.object({ id: z.string() }))
        }
      ])
      .handler(() => Response.json([{ id: 'inv_1' }]))
  },
  {
    openApiPath: {
      description: 'Billing collection endpoint'
    }
  }
);
```

## CLI Basics

```bash
NODE_OPTIONS='--import=tsx' npx next-rest-framework generate
NODE_OPTIONS='--import=tsx' npx next-rest-framework validate
```

Use `tsx` loader when CLI evaluates TypeScript source.

## CLI with Multiple Docs Configs

```bash
NODE_OPTIONS='--import=tsx' npx next-rest-framework generate --configPath /api/v2
NODE_OPTIONS='--import=tsx' npx next-rest-framework validate --configPath /api/v2
```

## Package.json Scripts

```json
{
  "scripts": {
    "openapi:generate": "NODE_OPTIONS='--import=tsx' next-rest-framework generate",
    "openapi:validate": "NODE_OPTIONS='--import=tsx' next-rest-framework validate"
  }
}
```

## Programmatic CLI Usage

```ts
import { generate } from 'next-rest-framework/dist/cli/generate';
import { validate } from 'next-rest-framework/dist/cli/validate';

await generate({ configPath: '/api/v2' });
await validate({ configPath: '/api/v2' });
```
