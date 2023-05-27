---
slug: next-rest-framework-0-3-4
title: Next REST Framework 0.3.4
authors: blomqma
tags: [Next.js, REST, API, TypeScript, object-schema validation, OpenAPI]
---

Next REST Framework has been out for around two months now, experiencing a lot breaking changes since the initial release. After the first test users battle-testing the framework and resolving the first issues, it's great to announce some new updates that I've been working on during the past two months.

Here are some of the improvements that Next.js has experienced so far since the initial release:

- Support for projects using `src` folder.
- Major stability improvements to the public API - better compatibility with other Next.js API routes.
- Support for typed query parameters. [Thanks @rliang for the issue!](https://github.com/blomqma/next-rest-framework/issues/11)
- Documentation improvements.
- Custom Swagger UI layout.
- Other minor improvements.

v0.3.4 being out with additional improvements to the typings, you no longer need to have both [Zod](https://zod.dev/) and installed to use the framework, resulting in a more lightweight approach wo use the framework.
