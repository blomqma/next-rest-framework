All notable changes to this project will be documented in this file.
We follow the [Semantic Versioning 2.0.0](http://semver.org/) format.

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
