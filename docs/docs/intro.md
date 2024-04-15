---
sidebar_position: 1
---

# Intro

### [Overview](#overview)

Next REST Framework is an open-source, opinionated, lightweight, easy-to-use set of tools to build type-safe, self-documenting APIs with [Next.js](http://nextjs.org/). Building OpenAPI specification-compliant REST APIs can be cumbersome and slow but Next REST Framework makes this easy with auto-generated OpenAPI documents and docs using TypeScript and object schemas.

- [Live demo](https://next-rest-framework-demo.vercel.app)

### [Features](#features)

### Lightweight, type-safe, easy to use

- Designed to work with TypeScript so that your requests and responses are strongly typed.
- Object-schema validation with [Zod](https://github.com/colinhacks/zod). The object schemas are automatically converted to JSON schema format for the auto-generated OpenAPI specification.
- Auto-generated and extensible `openapi.json` spec file from your business logic.
- Auto-generated [Redoc](https://github.com/Redocly/redoc) and/or [SwaggerUI](https://swagger.io/tools/swagger-ui/) documentation frontend.
- Works with Next.js [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) and other server-side libraries, like [NextAuth.js](#https://github.com/nextauthjs/next-auth).
- Supports both Next.js [app router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [pages router](https://nextjs.org/docs/pages/building-your-application/routing), even at the same time.
- Fully customizable and compatible with any existing Next.js project.
- Supports [Edge runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes).

## [Requirements](#requirements)

- Node.js v18.x. If you have an API using `File` or `FormData` web APIs, you might need Node v20.x, see: https://github.com/vercel/next.js/discussions/56032

You also need the following dependencies installed in you Next.js project:

- [Next.js](https://github.com/vercel/next.js) >= v12
- Optional (needed for validating input): [Zod](https://github.com/colinhacks/zod) >= v3
- Optional: [TypeScript](https://www.typescriptlang.org/) >= v3
- Optional (needed when using the CLI commands and using TypeScript): [tsx](https://github.com/privatenumber/tsx) >= v4
- Optional (needed if working with forms): [zod-form-data](https://www.npmjs.com/package/zod-form-data) >= v2

### [Installation](#installation)

```sh
npm install next-rest-framework
```
