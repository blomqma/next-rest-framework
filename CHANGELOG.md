All notable changes to this project will be documented in this file.
We follow the [Semantic Versioning 2.0.0](http://semver.org/) format.

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
