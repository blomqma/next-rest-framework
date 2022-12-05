---
sidebar_position: 1
---

# Intro

## [Overview](#overview)

Next REST Framework is an open-source, opinionated, lightweight, easy-to-use set of tools to build type-safe, self-documenting HTTP REST APIs with [Next.js](http://nextjs.org/). Building OpenAPI specification-compliant REST APIs can be cumbersome and slow but Next REST Framework makes this easy with auto-generated OpenAPI documents and Swagger UI using TypeScript and object schemas.

This is a monorepo containing the following packages / projects:

1. The primary `next-rest-framework` package
2. A development test application

## [Features](#features)

### Lightweight, type-safe, easy to use

- Designed to work with TypeScript so that your request bodies, responses, headers etc. are strongly typed.
- Object-schema validation with popular libraries like [Zod](https://github.com/colinhacks/zod) or [Yup](https://github.com/jquense/yup)
- Supports auto-generated openapi.json and openapi.yaml documents for which you can include your existing OpenAPI specification.
- Supports any kind of middleware logic that you want to use for authentication etc. See more in [Middlewares](#middlewares). Also works with other Next.js server-side libraries, like [NextAuth.js](#https://github.com/nextauthjs/next-auth).
- Fully customizable - You can decide which routes Next REST Framework will use to serve your API docs etc. and it can be easily customized to work with any kind of existing Next.js REST API.

## [Installation](#installation)

```
npm install --save next-rest-framework
```
