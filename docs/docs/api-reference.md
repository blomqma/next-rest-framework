---
sidebar_position: 3
---

# API reference

### [Config options](#config-options)

The optional config options allow you to customize Next REST Framework. The following options can be passed as a parameter for your `NextRestFramework` client in an object:

| Name                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appDirPath`           |  Absolute path from the project root to the root directory where your Routes are located when using App Router. Next REST Framework uses this as the root directory to recursively search for your Routes, so being as specific as possible will improve performance. This option is not required when using Pages Router, but it can be used together with the `apiRoutesPath` option when using both routers at the same time.                                 |
| `apiRoutesPath`        |  Absolute path from the project root to the root directory where your API Routes are located when using Pages Router. Next REST Framework uses this as the root directory to recursively search for your API Routes, so being as specific as possible will improve performance. This option is not required when using App Router, but it can be used together with the `appDirPath` option when using both routers at the same time.                            |
| `deniedPaths`          | Array of paths that are denied by Next REST Framework and not included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/disallowed-path', '/api/disallowed-path-2/*', '/api/disallowed-path-3/**']` Defaults to no paths being disallowed.                                                                                                                                           |
| `allowedPaths`         | Array of paths that are allowed by Next REST Framework and included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/allowed-path', '/api/allowed-path-2/*', '/api/allowed-path-3/**']` Defaults to all paths being allowed.                                                                                                                                                         |
| `openApiJsonPath`      | Custom path for serving `openapi.json` file. Defaults to `/api/openapi.json`.                                                                                                                                                                                                                                                                                                                                                                                    |
| `openApiYamlPath`      | Custom path for serving `openapi.yaml` file. Defaults to `/api/openapi.yaml`.                                                                                                                                                                                                                                                                                                                                                                                    |
| `swaggerUiPath`        | Custom path for service Swagger UI. Defaults to `/api`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `swaggerUiConfig`      | A [SwaggerUI config](#swaggerui-config) object for customizing the generated SwaggerUI.                                                                                                                                                                                                                                                                                                                                                                          |
| `exposeOpenApiSpec`    | Setting this to `false` will serve none of the OpenAPI documents neither the Swagger UI. Defaults to `true`.                                                                                                                                                                                                                                                                                                                                                     |
| `errorHandler`         | An error handler function used to catch errors in your routes. Both synchronous and asynchronous handlers are supported. The function takes in the same parameters as the Next.js [App Router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers. Defaults to a basic error handler logging the errors in non-production mode. |
| `suppressInfo`         | Setting this to `true` will suppress all informational logs from Next REST Framework. Defaults to `false`.                                                                                                                                                                                                                                                                                                                                                       |
| `generatePathsTimeout` | Timeout in milliseconds for generating the OpenAPI spec. Defaults to 5000. For large applications you might have to increase this.                                                                                                                                                                                                                                                                                                                               |

### [Route config](#route-config)

The route config parameters define an individual route, applicable for all endpoints (methods) that are using that route:

| Name                                                       | Description                                                                                                                                                                   | Required |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH` | A [Method handler](#method-handlers) object.                                                                                                                                  | `true`   |
| `openApiSpecOverrides`                                     | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated and higher level specifications. | `false`  |

#### [Method handlers](#method-handlers)

The method handler parameters define an individual endpoint:

| Name                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                     | Required |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `input`                | An [Input object](#input-object) object.                                                                                                                                                                                                                                                                                                                                                                                                        | `false`  |
| `output`               | An array of [Output objects](#output-object).                                                                                                                                                                                                                                                                                                                                                                                                   |  `true`  |
| `handler`              |  Your handler function that takes in your typed request and response (when using Pages Router). Both synchronous and asynchronous handlers are supported. The function takes in strongly-typed versions of the same parameters as the Next.js [App Router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers. | `true`   |
| `openApiSpecOverrides` | An OpenAPI [Operation object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated and higher level specifications.                                                                                                                                                                                                                                                                   | `false`  |

##### [Input object](#input-object)

The input object is used for the validation and OpenAPI documentation of the incoming request:

| Name          | Description                                                                                                                                  | Required |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type header of the request. A request with no content type header or a incorrect content type header will get an error response. | `true`   |
| `body`        | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the request body.                                                 | `true`   |
| `query`       | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the query parameters.                                             | `false`  |

##### [Output object](#output-object)

The output objects define what kind of responses are returned from your API handler and is used for the OpenAPI documentation of the response:

| Name          | Description                                                                                                                                                       | Required |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `status`      | A status code that your API can return.                                                                                                                           | `true`   |
| `contentType` | The content type header of the response.                                                                                                                          | `true`   |
| `schema`      | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the response data. A response body not matching to the schema will lead to a TS error. |  `true`  |

### [SwaggerUI config](#swaggerui-config)

The SwaggerUI config object can be used to customize the generated Swagger UI:

| Name           | Description                                                           |
| -------------- | --------------------------------------------------------------------- |
| `defaultTheme` | Default theme (light/dark) to use for SwaggerUI - defaults to "light" |
| `title`        | Custom page title meta tag value.                                     |
| `description`  | Custom page description meta tag value.                               |
| `logoHref`     | An href for a custom logo.                                            |
| `faviconHref`  | An href for a custom favicon.                                         |

## [Changelog](#changelog)

See the changelog in [CHANGELOG.md](https://github.com/blomqma/next-rest-framework/blob/main/CHANGELOG.md)

## [Contributing](#contributing)

All contributions are welcome!

## [License](#license)

ISC, see full license in [LICENSE](https://github.com/blomqma/next-rest-framework/blob/main/LICENCE).
