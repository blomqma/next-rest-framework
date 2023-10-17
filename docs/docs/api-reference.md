---
sidebar_position: 3
---

# API reference

### [Docs handler options](#docs-handler-options)

The following options can be passed to the `docsRouteHandler` (App Router) and `docsApiRouteHandler` (Pages Router) functions for customizing Next REST Framework:

| Name                      | Description                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deniedPaths`             | Array of paths that are denied by Next REST Framework and not included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/disallowed-path', '/api/disallowed-path-2/*', '/api/disallowed-path-3/**']` Defaults to no paths being disallowed. |
| `allowedPaths`            | Array of paths that are allowed by Next REST Framework and included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/allowed-path', '/api/allowed-path-2/*', '/api/allowed-path-3/**']` Defaults to all paths being allowed.               |
| `openApiSpecOverrides`    | Overrides to the generated OpenAPI spec.                                                                                                                                                                                                                                                                               |
| `openApiJsonPath`         | Path that will be used for fetching the OpenAPI spec - defaults to `/openapi.json`. This path also determines the path where this file will be generated inside the `public` folder.                                                                                                                                   |
| `autoGenerateOpenApiSpec` | Setting this to `false` will not automatically update the generated OpenAPI spec when calling the Next REST Framework endpoint. Defaults to `true`.                                                                                                                                                                    |
| `docsConfig`              | A [Docs config](#docs-config) object for customizing the generated docs.                                                                                                                                                                                                                                               |
| `suppressInfo`            | Setting this to `true` will suppress all informational logs from Next REST Framework. Defaults to `false`.                                                                                                                                                                                                             |
| `generatePathsTimeout`    | Timeout in milliseconds for generating the OpenAPI spec. Defaults to 5000. For large applications you might have to increase this.                                                                                                                                                                                     |

### [Docs config](#docs-config)

The docs config options can be used to customize the generated docs:

| Name          | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `provider`    | Docs provider determining whether to render Redoc or SwaggerUI. Defaults to Redoc. |
| `title`       | Custom page title meta tag value.                                                  |
| `description` | Custom page description meta tag value.                                            |
| `faviconUrl`  | A URL for a custom favicon.                                                        |
| `logoUrl`     | A URL for a custom logo.                                                           |

### [Route handler options](#route-handler-options)

The following options cam be passed to the `routeHandler` (App Router) and `apiRouteHandler` (Pages Router) functions to create new API endpoints:

| Name                                                       | Description                                                                                                                                                 | Required |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH` | A [Method handler](#method-handlers) object.                                                                                                                | `true`   |
| `openApiPath`                                              | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification. | `false`  |

#### [Route operations](#route-operations)

The route operation functions `routeOperation` (App Router) and `apiRouteOperation` (Pages Router) allow you to define your API handlers for your endpoints. These functions accept an OpenAPI [Operation object](https://swagger.io/specification/#operation-object) as a parameter, that can be used to override the auto-generated specification. Calling this function allows you to chain your API handler logic with the following functions.

| Name      | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `input`   | An [Input](#input) function for defining the validation and documentation of the request.    |
| `output`  | An [Output](#output) function for defining the validation and documentation of the response. |
| `handler` | A [Handler](#handler) function for defining your business logic.                             |

##### [Input](#input)

The input function is used for validation and documentation of the request, taking in an object with the following properties:

| Name          | Description                                                                                                                                           | Required |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type header of the request. When the content type is defined, a request with an incorrect content type header will get an error response. | `false`  |
| `body`        | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the request body.                                                          | `false`  |
| `query`       | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the query parameters.                                                      | `false`  |

Calling the input function allows you to chain your API handler logic with the [Output](#output) and [Handler](#handler) functions.

##### [Output](#output)

The output function is used for validation and documentation of the response, taking in an array of objects with the following properties:

| Name          | Description                                                                                                                                                       | Required |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `status`      | A status code that your API can return.                                                                                                                           | `true`   |
| `contentType` | The content type header of the response.                                                                                                                          | `true`   |
| `schema`      | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the response data. A response body not matching to the schema will lead to a TS error. |  `true`  |

Calling the input function allows you to chain your API handler logic with the [Handler](#handler) function.

##### [Handler](#handler)

The handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly-typed versions of the same parameters as the Next.js [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers.
