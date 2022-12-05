---
slug: announcing-next-rest-framework
title: Announcing Next REST Framework
authors: blomqma
tags: [Next.js, REST, API, TypeScript, object-schema validation, OpenAPI]
---

Although [Next.js](http://nextjs.org/) has been a valid option for full-stack applications for a while now, a lot of developer have limited the use of it only for the frontend parts of their applications. The Next.js [API Routes](#https://nextjs.org/docs/api-routes/introduction) are however, a great way to build a backend for your [dynamic applications](https://blog.logrocket.com/implementing-ssr-next-js-dynamic-routing-prefetching/).

The Next.js ecosystem has been evolving rapidly in the past few years and we've seen great server-side frameworks, like [tRPC](https://trpc.io/), emerging. Similar choices for REST APIs have been lacking and personally I've been reinventing the wheel over and over again on every Next.js backend I've been building during the past few years. The learnings from repeating the same things from project to project led to developing Next REST Framework, which is an open-source, lightweight, easy-to-use set of tools to build type-safe, self-documenting HTTP REST APIs with Next.js.

The first problem that Next REST Framework aims to solve lies in ensuring that your backend is type-safe, using [TypeScript](https://www.typescriptlang.org/) and object-schema validation with popular libraries like [Zod](https://zod.dev/) and [Yup](https://github.com/jquense/yup). Secondly, Next REST Framework self-documents your API straight from your business logic and not from endless lines of open API [JSDoc](https://jsdoc.app/) annotations etc. just like with other popular REST API frameworks like [Fast API](https://fastapi.tiangolo.com/) and [Django REST Framework](https://www.django-rest-framework.org/).
