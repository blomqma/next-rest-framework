# Architecture

Next REST Framework is heavily tied to the Next.js APIs and the high-level architecture of the framework consists of two main parts, the CLI and the public used for runtime:

![High-level architecture](./docs/static/high-level-architecture.svg)

## Public API

The public API of Next REST Framework contains all of the functions you need to use the framework and build your APIs. These are the entry points that handle the request validation and they also provide internal methods for generating the open API spec for the given single endpoint, used by the CLI.

## CLI

The CLI contains most of the logic when it comes to actually building the OpenAPI spec from your APIs and generating the `openapi.json` file. Note that generating the OpenAPI spec and exposing a public documentation are completely optional and Next REST Framework can be used without them for it's type-safety features.

For the CLI to be able to generate the OpenAPI spec, it needs to parse and read your code that is built using the methods from the public API. This process includes an intermediate step of bundling the relevant code to a common format regardless of the environment the CLI is run. For this, ESBuild is used to generate a temporary bundle of a subset of the application in a folder called `.next-rest-framework`. This build output is then analyzed by the CLI and the Zod schemas are parsed from each endpoint and included to a single output written in the `openapi.json` file.
