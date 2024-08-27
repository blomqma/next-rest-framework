All notable changes to this project will be documented in this file.
We follow the [Semantic Versioning 2.0.0](http://semver.org/) format.

### 6.0.4 - 2024-08-27

#### Fixed

- Add support for CJS imports in generate.

### 6.0.3 - 2024-08-27

#### Added

- Add proper error handling for generating OpenAPI paths from routes & API routes.

### 6.0.2 - 2024-08-27

#### Fixed

- Fix inferred request body type for RPC API routes.

### Added

- Add dynamically included JSON schemas for request body, query and path parameter validation errors when validation schemas for them exist.

### 6.0.1 - 2024-05-10

#### Fixed

- Fix dynamic server usage in app router docs endpoint by reading the headers from a cloned request object.

### 6.0.0 - 2024-05-04

#### Fixed

- Fix TS errors when using an async middleware.

#### Added

- Export typings for `TypedNextRequest`, `TypedNextApiRequest` and `TypedNextApiResponse` so that they can be used for custom abstractions.

### 6.0.0-beta.4 - 2024-04-17

#### Fixed

- Fix CLI commands causing ESBuild errors with third-party dependencies by parsing the OpenAPI specifications from the source code instead using `tsx`.

### 6.0.0-beta.3 - 2024-04-13

#### Added

- Add support for validating path parameters separately from query parameters with pages router.

### 6.0.0-beta.2 - 2024-03-27

#### Added

- Add support for validating path parameters with error responses for app router & using Zod-parsed path parameters.
- Add 10s form parsing timeout for pages router.

#### Fixed

- Fix `req.json()` returning JSON serialized Zod-parsed request body instead of raw Zod-parsed body.
- Fix RPC route response serialization for form data (app router and pages router) and File/Blob responses (pages router).

### 6.0.0-beta.1 - 2024-03-24

This is a breaking change that improves handling form data requests for both app router and pages router routes and RPC routes.

#### Added

- Add support for strongly typed form data.
- Add support for overriding generated JSON schema with a custom JSON schema for request bodies, search params and response bodies.
- Add support for (strongly typed) form data for RPC routes.

#### Changed

- Rename response body schema in output objects from `schema` -> `body` for consistent naming conventions.

#### Fixed

- Misc docs fixes.

### 5.1.12 - 2024-03-23

### Fixed

- Fix CLI not finding config when using pages router and `src` folder.

### 5.1.11 - 2024-02-28

### Fixed

- Fix `node_modules` being resolved by ESBuild when running the CLI commands with `npm`/`npx`.

### 5.1.10 - 2024-02-27

### Fixed

- Fix external dependency resolution causing the CLI commands not working for some users.

### 5.1.9 - 2024-02-26

### Fixed

- Fix OpenAPI spec generation for query parameters.

### 5.1.8 - 2024-02-26

### Fixed

- Fix RPC route returning an error when using a middleware with no input.
- Fix typings for asynchronous `routeOperation`/`apiRouteOperation` middlewares.

### 5.1.7 - 2024-02-25

### Fixed

- Fix custom HTTP responses from middleware functions not working with app router endpoints.

### 5.1.6 - 2024-02-24

### Fixed

- Fix request body being parsed as `ReadableStream` instead of JSON when used in app router RPC endpoints.

### 5.1.5 - 2024-02-24

### Removed

- Remove additional console logs from the CLI commands.

### 5.1.4 - 2024-02-24

### 5.1.4-beta.1 - 2024-02-20

#### Fixed

- Add ESBuild [external packages](https://esbuild.github.io/api/#packages) option to prevent any dependencies from being bundled as part of the CLI commands.

### 5.1.3 - 2024-02-14

#### Fixed

- Fix `__dirname` not defined during `next build` with a custom ESBuild plugin.

### 5.1.2 - 2024-02-14

#### Fixed

- Remove all peer dependencies from the library causing a runtime import error.

### 5.1.1 - 2024-02-14

#### Fixed

- Fix runtime issue of Next.js modules not being imported correctly.

### 5.1.0 - 2024-02-14

#### Fixed

- Fix CLI commands not working on Windows due to incorrect file import URLs.
- Fix ESM bundling by defining `next` and `zod` as peer dependencies and exclude them from the bundle.
- Docs fixes.

#### Added

- Add support for custom OG meta tags in the Redoc/SwaggerUI documentation.

### 5.0.1 - 2024-02-01

#### Fixed

- Fix bug of CLI not working when explicit ESM is set in `package.json`.

#### Removed

- Remove unneeded `tsConfigPath` option from CLI commands that is no longer needed.

### 5.0.0 - 2024-01-29

TLDR: All Node.js API specific code is split
into the CLI which is much more reliable now.
Support for generating the OpenAPI spec automatically
when running the development server is dropped and
handled by the CLI command
`npx next-rest-framework generate` instead.

#### Add Edge runtime compatibility

This is a major change that simplifies the OpenAPI sepc
generation process, and adds Edge runtime support.

#### Removing development-server generation:

This change completely removes the automatic
local OpenAPI spec generation when calling the
documentation endpoint and leaves the spec
generation completely for the CLI which is now
much more reliable for the following reason:

Previously the file system based OpenAPI
spec generation done by the CLI used the
build output generated by Next.js in the
`.next` folder. This was however suboptimal
as there's no guarantee that the module
structure won't change between Next.js versions,
breaking the CLI. A new approach is that the
CLI commands `generate` and `validate` now
generate a temporary build folder called
`.next-rest-framework` which is compiled using
ESBuild which produces consistent output from
the CLI. This temporary folder is used to gather
the OpenAPI paths from the generated routes
and api routes that works with all Next.js versions.
This is also much faster than running `next build`
every time with the CLI.

With this changes, all Node.js file system based
API calls etc. are split do a different bundle so that
the code also works in the Edge runtime.

#### Fixed:

- Fixed the ESM entry point causing NRF not
  being loaded as ESM.
- Fixed the possible return status codes from RPC
  routes to match the generated OpenAPI spec.

### 4.3.0 - 2024-01-10

### Changed

- Build the code for both ESM and CJS outputs using `tsup`.

### 4.2.0 - 2024-01-09

### Added

- Add support for chaining up to three middlewares together and sharing data between the middlewares.

### 4.1.2 - 2023-12-18

### Fixed

- Fix typings for optional additional OpenAPI properties that are merged with the generated document.

### 4.1.1 - 2023-12-18

### Fixed

- Fix RPC data structure to merge in CLI commands.

Thanks to @roothybrid7 for the fix!

### 4.1.0 - 2023-12-13

### Changed

- Improve typings, OpenAPI generation, RPC logic and documentation. Rename several public APIs and deprecate the old ones:

* `docsRouteHandler` -> `docsRoute`
* `routeHandler` -> `route`
* `rpcRouteHandler` -> `rpcRoute`
* `apiRouteHandler` -> `apiRoute`
* `docsApiRouteHandler` -> `docsApiRoute`
* `rpcApiRouteHandler` -> `rpcApiRoute`

### 4.0.0 - 2023-11-21

### Added

- Add support for creating RPC endpoints.

#### Breaking change:

The `output` function has been renamed to `outputs` for clarity, simply renaming this will be enough for upgrading.

### 3.4.7 - 2023-11-14

### Fixed

- Fix `prettier` import potentially causing a module resolution issue in some Node.js environments.

### 3.4.6 - 2023-11-12

### Added

- Add CLI option to view additional logs for debugging purposes for the `generate` and `validate` commands.

### 3.4.4 - 2023-11-06

### Changed

- Use content-relative URL for fetching the `openapi.json` in the docs clients.

### 3.4.3 - 2023-11-05

### Fixed

- Fix OpenAPI generation with dynamic routes that contain multiple path parameters.

### 3.4.2 - 2023-11-05

### Fixed

- Fix npm install not working on Windows.

### 3.4.1 - 2023-10-24

### Fixed

- Fix TypedNextResponse usage.

### 3.4.0 - 2023-10-24

### Added

- Add support for strongly-typed response content-type headers.

### 3.3.0 - 2023-10-23

### Added

- Add support for strongly-typed NextResponse

### 3.2.0 - 2023-10-23

### Added

- Add an option to include a middleware function for the method handlers, that gets executed before the request input is validated.

### 3.1.1 - 2023-10-19

### Fixed

- Fix request handling when using a proxy or HTTPS connections locally.

### 3.1.0 - 2023-10-19

### Added

- Add new `next-rest-framework validate` CLI command, that checks that the generated `openapi.json` file is up to date.

### Changed

- Improves the CLI performance, making it supported in any runtime.

### 3.0.1 - 2023-10-18

### Changed

- Overrides the OpenAPI info `title` and `description` values with the docs config values when rendering the docs.

### 3.0.0 - 2023-10-18

### Changed

This is another breaking change before another
major release. This mostly changes the API on
creating new endpoints. The old object-based
definition of API endpoints is replaced by
a functional model, familiar from e.g. the trpc
library.

The docs route handlers and route handler functions
are renamed, followed up with new utility function
used in conjunction with the new `routeHandler` and
`apiRouteHandler` functions. The new additional
`routeOperation` (app router) and `apiRouteOperation`
(pages router) functions expose the same old API
including the input, output and handler definitions
in a slightly new format by chaining the oprations
after each other.

We also recently dropped SwaggerUI that was replaced
by Redoc. This change allows the user to defined their
desired docs frontend, bringing back the option to
use SwaggerUI or even both Redoc and SwaggerUI at the
same time.

### Fixed

This fixes the query parameter typings
that were incorrect for both routers so that they
are safer to use.

This also fixes duplicate inclusion of the parameters
in the OpenAPI spec when using dynamic routes.

There are also some typings improvements for response
status codes, that we're not working previously.
Unfortunately, for app router the status codes are
still not limited to the user-defined response statuses,
because the `NextResponse` API makes this impossible.

### 2.0.1 - 2023-10-15

### Fixed

This fixes a bug that caused an infinite request
loop when using pages router and the docs endpoint
was not ignored by the OpenAPI path generation.

This fix also allows defining multiple different docs
endpoints, although that should be a rare case.
The request protocol parsing is also now handled
differently with pages router and cases where the
protocol headers contain multiple protocols should
be handled now.

### 2.0.0 - 2023-10-15

Improve DX, API docs, router compability etc.

This is another breaking change to multiple
components of the framework, changing the client
API, simplifying route definition etc.

**Re-designed client API**

Previously all features of the framework were
available via single client, initialized by the
user in their code base. This change removes the
concept of initializing a client and accessing route
definitions etc. via the client.

The documentation part is now decoupled from defining
individual routes, meaning that the new simplified
workflow allows the developer to define a single route
for the generated documentation if they want it.

Individual routes can still be defined like before,
without importing the route definitions from the client.

The documentation endpoint also does not have to be a
catch-all route and it can be defined anywhere in the code
base without breaking things.

In addition to having less boilerplate with the new
client API, we also get rid of configuring the paths
for the `app` and `pages` directories. The new smarter
approach handles this automatically by scanning these
folders automatically, detecting the `src` directory
is in use.

**Streamlined OpenAPI spec generation**

Previously, we were storing the generated `openapi.json`
file in the root of the project and serving that via another
internal endpoint. The new approach simply generates the spec
file directly to the `public` folder, where it will be served
for the API documentation.

**Replacing SwaggerUI with Redoc**

Redoc is a great open source project and replacement for
SwaggerUI, offering more features like richer endpoint
previews, search etc. The new rendered API documentation
uses Redocly and it can still be configured and customized
by the developer.

### 1.2.4 - 2023-10-09

### Fixed

- Fix query parameter validation on app router - now the search parameters are validated similarly to when using pages router.
- Fix content type validation when no user-defined content type validation is set.

### 1.2.3 - 2023-10-07

### Fixed

- Fix `appDirPath` handling when not using src directory.

### 1.2.2 - 2023-10-01

### Fixed

- Fix miscellaneous issues with generating the OpenAPI spec from Zod schema, by using `zod-to-json-schema`.

### 1.2.1 - 2023-09-30

### Fixed

- Fix request body validation with app router. The new validation clones the request object before validating it, allowing the request body to be further parsed by the API handler.

### 1.2.0 - 2023-09-27

### Added

- Add option to allow/deny paths from Next REST Framework. This ensures better compability with other third-party server-side libraries and routes not using Next REST Framework.
- Add logging for error cases when the app/pages directory is not found based on the config options.
- Add logging for ignored paths based on the allow/deny lists.

### 1.1.1 - 2023-09-26

### Fixed

- Fix pages router example code snippets in readme and docs pages.

### 1.1.0 - 2023-09-26

### Fixed

- Fix an error of the pages directory not being found when only using pages router.
- Fix app router catch-all route documentation in the readme.

### Added

- Add support for dark theme in the SwaggerUI.

### 1.0.2 - 2023-09-23

### Fixed

- Fixed an idempotency issue in the OpenAPI paths generation where the ordering of the generated paths was inconsistent between executions.

### Changed

- Changed the OpenAPI spec generation to not make file system calls for API routes files when the config option `apiRoutesPath` is not defined.

### 1.0.1 - 2023-09-13

Full details available in this PR: https://github.com/blomqma/next-rest-framework/pull/49

### Added

- Add support for Next.js app router

### Removed

- Remove support for global, route and method middlewares.
- Remove support for HTTP TRACE.
- Removed support for Node.js 16.

### Changed

- Running `next-rest-framework generate` is no longer encouraged to be run together with `next build`.

### 0.8.0 - 2023-05-27

### Removed

- Drop support for Yup schemas in order to better support Zod that is the main object-schema validation library used with the framework.

### Added

- Add support for all applicable Zod schema types listed in their docs: https://zod.dev

### 0.7.2 - 2023-05-19

### Fixed

- Fix path finding for windows environments, and add path parameters to OpenAPI spec.

### 0.7.1 - 2023-05-09

### Fixed

- Fix miscellaneous bugs with Zod schemas, where `intersection`, `nullable` and `enum` types were not working with the OpenAPI spec generation.

### 0.7.0 - 2023-04-17

### Added

- Add a binary script that can be used programmatically to generate the OpenAPI spec e.g. before running `next build`.

### 0.6.0 - 2023-04-11

### Added

- Add SwaggerUI customization options for using custom title, description, logo and favicon.

### Fixed

- Fix bug that caused custom OpenAPI YAML file paths not working.
- Fix documentation and examples that were using Zod number schemas for query parameter validation, resulting in an error when following the examples.

### 0.5.1 - 2023-03-28

### Fixed

- Revert the addition of the `localOpenApiSpec` config option. Using a user-defined route resulted in the generated OpenAPI spec file not being included in the Vercel build artifacts, thus making it not work. This issue is fixed by using a static path for the spec file so it will be always called `openapi.json` and lies in the project root.

### 0.5.0 - 2023-03-28

### Changed

- Change OpenAPI generation by generating a local OpenAPI spec file that is dynamically updated in local development and used in production for the OpenAPI endpoints. Rename the `openApiSpec` config option to `openApiSpecOverrides` for better clarity with the added `localOpenApiSpec` path option.

### 0.4.2 - 2023-03-21

### Fixed

- Fix bug with middlewares and error handlers that responded to the API request and the execution was not stopped.

### 0.4.1 - 2023-03-20

### Fixed

- Fix the getting started docs containing a typo that caused an error.

### 0.4.0 - 2023-03-15

### Fixed

- Fix the OpenAPI instrumentation for dynamic routes containing parameters that were not displayed correctly in the Swagger UI.

### Changed

- Defining content type and request body are no longer required in the `input` object. Making the endpoint definition friendlier for different types of requests.

### 0.3.7 - 2023-03-09

### Fixed

- Fix previous release not reflecting the latest changes introduced in the release notes of v0.3.6.

### 0.3.6 - 2023-03-08

### Fixed

- Fix a bug that prevented nested API routes from being included into the OpenAPI spec.

### 0.3.5 - 2023-02-21

### Fixed

- Fix content type header bug by removing the content type header parameters from the header validation logic. This caused e.g. form data requests to fail at runtime.

### 0.3.4 - 2023-02-20

### Fixed

- Fix Zod/Yup typings so that both of those dependencies are no longer needed for using the framework.

### 0.3.3 - 2023-02-20

### Fixed

- This fixes some compability issues with user-defined
  API routes that are not using Next REST Framework.
  There was a bug in the API route path matching where
  the comparison to the reserved paths was not exact,
  making some user-defined API routes to be completely
  skipped in some cases.
- Other fix here is that the instrumentation requests are now
  aborted after 200ms in case the user-defined APIs do not
  respond in that time.

### 0.3.2 - 2023-02-20

### Added

- Add support for projects using a `src` folder with a new config option called `apiRoutesPath`.

### 0.3.1 - 2023-01-23

### Changed

- Change miscellaneous copyright texts and contact emails.

### 0.3.0 - 2023-01-15

### Added

- Added support for typed query parameters. This changes the `input`
  object API by renaming the `schema` attribute to `body` and adding a
  `query` attribute that can be used to type and validate
  query parameters for endpoints.

### 0.2.3 - 2023-01-09

### Fixed

- Fixed an issue when using multiple output objects with
  different types - now the output types are combined
  with a union type to allow multiple different outputs.

### 0.2.2 - 2023-01-09

### Fixed

Fix documentation on readme included with the NPM package.

### 0.2.1 - 2023-01-07

### Changed

- Changed the Swagger UI layout by adding a custom navbar and footer components.
- Changed the include Swagger UI by loading the assets from unpkg CDN and significantly reducing the bundle size.

### 0.2.0 - 2023-01-03

### Changed

- The public API is changed in a way that the OpenAPI spec generation is split out from the input/output validation. The validation is now done with `input` and `output` keywords within the `defineEndpoints` handler, that generates a minimal OpenAPI spec out of the contents of the input and output definitions and all other OpenAPI generation-related overrides are done inside the `openApiSpec` object. This makes the separation of the business logic and documentation clearer, while still auto-generating the definitions from the application logic.

### 0.1.2 - 2022-12-09

### Fixed

- Fix static URL that was used for API route instrumentation. The hardcoded value is now replaced with a dynamic value that should work in all environment. This change also caused the removal of the `getOpenApiSpec` function from the API. This is considered to be an API-breaking change but the early versions are not considered to be in use yet so it's safe to include it here.

## 0.1.1 - 2022-12-09

### Fixed

- Fix NPM package not working due to CommonJS and ESM interoperability issue.
- Fix missing `summary` field from OpenAPI paths.
- Fix miscellaneous typos in README.

### Added

- Add an example application with the installed NPM package.

## 0.1.0 - 2022-12-03

### Added

- Added initial version of Next REST Framework.
