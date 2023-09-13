All notable changes to this project will be documented in this file.
We follow the [Semantic Versioning 2.0.0](http://semver.org/) format.

### 1.0.0 - 2023-09-13

Full details available in this PR: https://github.com/blomqma/next-rest-framework/pull/49

### Added

- Add support for Next.js App Router

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
