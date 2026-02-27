---
name: create-next-rest-framework-api
description: Set up and implement type-safe Next.js APIs with next-rest-framework. Use when creating or refactoring App Router or Pages Router docs endpoints, REST routes, RPC routes, JSON or form-data handlers, middleware chains, typed outputs with TypedNextResponse, OpenAPI customization, or next-rest-framework CLI generation and validation workflows.
---

# Create Next REST Framework API

Implement Next.js APIs with `next-rest-framework` using schema-driven request validation, typed responses, and OpenAPI generation.

## Workflow

1. Pick router surface first: App Router (`docsRoute`, `route`, `routeOperation`, `rpcRoute`) or Pages Router (`docsApiRoute`, `apiRoute`, `apiRouteOperation`, `rpcApiRoute`).
2. Load only the reference file needed for the task:
- `references/app-router.md`
- `references/pages-router.md`
- `references/forms-and-typed-responses.md`
- `references/openapi-and-cli.md`
3. Define input and output schemas before handler logic.
4. Add middleware only for cross-cutting concerns (auth, tracing, feature flags), and pass derived context through middleware return values.
5. Wire docs and CLI (`generate` and `validate`) so OpenAPI stays current in CI.

## Router Selection

- Use App Router handlers when files live under `src/app/**/route.ts`.
- Use Pages Router handlers when files live under `src/pages/api/**/*.ts`.
- Keep RPC routes at:
- App Router: `.../[operationId]/route.ts`
- Pages Router: `.../[operationId].ts`

## Guardrails

- Use `zod-form-data` schemas for `application/x-www-form-urlencoded` and `multipart/form-data` request bodies.
- Use plain Zod schemas for JSON request/response bodies.
- For multipart file schemas that cannot be represented correctly from Zod, provide explicit `bodySchema` JSON Schema overrides.
- In App Router, return `TypedNextResponse` when you want compile-time enforcement of declared status/content-type outputs.
- In Pages Router multipart handlers, disable Next body parser (`export const config = { api: { bodyParser: false } }`).
- Use `openApiPath` at route level and `openApiOperation` at operation level for targeted OpenAPI overrides.

## Done Criteria

- Endpoints compile with inferred input/output types.
- Error and success responses match declared `outputs`.
- Docs endpoint renders and includes intended paths (`allowedPaths` / `deniedPaths`).
- `next-rest-framework generate` and `next-rest-framework validate` pass for the intended docs config path.
