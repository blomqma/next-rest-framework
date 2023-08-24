---
sidebar_position: 1
---

# Intro

### [Overview](#overview)

Next REST Framework is an open-source, opinionated, lightweight, easy-to-use set of tools to build type-safe, self-documenting HTTP REST APIs with [Next.js](http://nextjs.org/). Building OpenAPI specification-compliant REST APIs can be cumbersome and slow but Next REST Framework makes this easy with auto-generated OpenAPI documents and Swagger UI using TypeScript and object schemas.

- [Live demo](https://next-rest-framework-demo.vercel.app/api)

### [Features](#features)

#### Lightweight, type-safe, easy to use

- Designed to work with TypeScript so that your request bodies, responses, headers etc. are strongly typed.
- Object-schema validation with [Zod](https://github.com/colinhacks/zod). The schemas are automatically converted to JSON schema format for the auto-generated OpenAPI specifications.
- Supports auto-generated openapi.json and openapi.yaml documents for which you can include your existing OpenAPI specification.
- Works with Next.js [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) and other server-side libraries, like [NextAuth.js](#https://github.com/nextauthjs/next-auth).
- Supports both Next.js [App Router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [Pages Router](https://nextjs.org/docs/pages/building-your-application/routing), even at the same time.
- Fully customizable - You can decide which routes Next REST Framework will use to serve your API docs etc. and it can be easily customized to work with any kind of existing Next.js REST API.

### [Installation](#installation)

```
npm install --save next-rest-framework
```
