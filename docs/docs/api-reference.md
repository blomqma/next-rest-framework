---
sidebar_position: 3
---

# API reference

### [Config options](#config-options)

The optional config options allow you to customize Next REST Framework. The following options can be passed to the `defineDocsRoute` (App Router) and `defineDocsApiRoute` (Pages Router) docs route handler functions:

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

### [Route config](#route-config)

The route config parameters passed to the `defineRoute` (App Router) and `defineApiRoute` (Pages Router) functions define an individual route, applicable for all endpoints that are using that route:

| Name                                                       | Description                                                                                                                                                                   | Required |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH` | A [Method handler](#method-handlers) object.                                                                                                                                  | `true`   |
| `openApiSpecOverrides`                                     | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated and higher level specifications. | `false`  |

#### [Method handlers](#method-handlers)

The method handler parameters define an individual endpoint:

| Name                   | Description                                                                                                                                                                                                                                                                                                                               | Required |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `input`                | An [Input object](#input-object) object.                                                                                                                                                                                                                                                                                                  | `false`  |
| `output`               | An array of [Output objects](#output-object).                                                                                                                                                                                                                                                                                             |  `true`  |
| `handler`              | A strongly-typed handler function for your API. The function takes in strongly-typed versions of the same parameters as the Next.js [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) handlers. | `true`   |
| `openApiSpecOverrides` | An OpenAPI [Operation object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated and higher level specifications.                                                                                                                                                             | `false`  |

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

### [Docs config](#docs-config)

The docs config object can be used to customize the generated docs:

| Name          | Description                             |
| ------------- | --------------------------------------- |
| `title`       | Custom page title meta tag value.       |
| `description` | Custom page description meta tag value. |
| `faviconUrl`  | A URL for a custom favicon.             |
| `logoUrl`     | A URL for a custom logo.                |
