---
sidebar_position: 3
---

# API reference

### [Config options](#config-options)

The optional config options allow you to customize Next REST Framework. The following options can be passed as a parameter for your `NextRestFramework` client in an object:

| Name                   | Description                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openApiSpecOverrides` | An [OpenAPI Object](https://swagger.io/specification/#openapi-object) that can be used to override and extend the auto-generated specification.          |
| `openApiJsonPath`      | Custom path for serving `openapi.json` file. Defaults to `/api/openapi.json`.                                                                            |
| `openApiYamlPath`      | Custom path for serving `openapi.yaml` file. Defaults to `/api/openapi.yaml`.                                                                            |
| `swaggerUiPath`        | Custom path for service Swagger UI. Defaults to `/api`.                                                                                                  |
| `swaggerUiConfig`      | A [SwaggerUI config](#swaggerui-config) object for customizing the generated SwaggerUI.                                                                  |
| `exposeOpenApiSpec`    | Setting this to `false` will serve none of the OpenAPI documents neither the Swagger UI. Defaults to `true`.                                             |
| `middleware`           | A global middleware for all of your API routes. See [Global middleware](#global-middleware) for more information.                                        |
| `errorHandler`         | A [Global error handler](#global-error-handler) for all of your API routes. Defaults to a basic error handler logging the errors in non-production mode. |
| `suppressInfo`         | Setting this to `true` will suppress all informational logs from Next REST Framework. Defaults to `false`.                                               |
| `apiRoutesPath`        |  Absolute path to the directory where your API routes are located - defaults to `pages/api`.                                                             |

### [Route config](#route-config)

The route config parameters define an individual route, applicable for all endpoints (methods) that are using that route:

| Name                                                                | Description                                                                                                                                                                   | Required |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GET \| PUT \| POST \| DELETE \| OPTIONS \| HEAD \| PATCH \| TRACE` | A [Method handler](#method-handlers) object.                                                                                                                                  | `true`   |
| `middleware`                                                        |  A [Middleware](#middlewares) function that takes in the return values from your [Global middleware](#global-middleware).                                                     | `false`  |
| `errorHandler`                                                      | A [Route error handler](#route-error-handler) for this API route, overriding the [Global error handler](#global-error-handler).                                               | `false`  |
| `openApiSpecOverrides`                                              | An OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated and higher level specifications. | `false`  |

### [Method handlers](#method-handlers)

The method handler parameters define an individual endpoint:

| Name                   | Description                                                                                                                                                                         | Required |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `input`                | An [Input object](#input-object) object.                                                                                                                                            | `false`  |
| `output`               | An array of [Output objects](#output-object).                                                                                                                                       |  `true`  |
| `middleware`           | A [Middleware](#middlewares) function that takes in the return values from both your [Global middleware](#global-middleware) and [Route middleware](#route-middleware).             |  `false` |
| `handler`              |  Your [Handler](#handler) function that takes in your typed request, response and [Middleware](#middlewares) parameters and contains all of your business logic.                    | `true`   |
| `errorHandler`         | A [Method error handler](#method-error-handler) for this method, overriding both the [Global error handler](#global-error-handler) and [Route error handler](#route-error-handler). | `false`  |
| `openApiSpecOverrides` | An OpenAPI [Operation object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated and higher level specifications.       | `false`  |

#### [Input](#input-object)

The input object is used for the validation of the incoming request:

| Name          | Description                                                                                                                                                                                                                                        | Required |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type that the request must have - request with no content type or incorrect content type will get an error response.                                                                                                                   | `true`   |
| `body`        | A [Zod](https://github.com/colinhacks/zod) or [Yup](https://github.com/jquense/yup) schema describing the format of the request body.                                                                                                              | `true`   |
| `query`       | A [Zod](https://github.com/colinhacks/zod) or [Yup](https://github.com/jquense/yup) schema describing the format of the query parameters. Note that Next.js parses the query string into an object containing either strings or arrays of strings. | `false`  |

#### [Output object](#output-object)

The output objects define what kind of responses you are allowed to return from your API handlers:

| Name          | Description                                                                                                                                                                                                  | Required |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `status`      | A possible status code that your API can return - using other status codes will lead to a TS error.                                                                                                          | `true`   |
| `contentType` | The content type of the response - using other content-types will lead to a TS error.                                                                                                                        | `true`   |
| `schema`      | A [Zod](https://github.com/colinhacks/zod) or [Yup](https://github.com/jquense/yup) schema describing the format of the response data. A response format not matching to the schema will lead to a TS error. |  `true`  |

#### [Handler](#handler)

The handler function takes care of your actual business logic, supporting both synchronous and asynchronous execution and taking in an object with three strongly typed parameters:

| Name     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`    |  A strongly-typed `NextApiRequest` object containing the typed body and query parameters of your request.                                                                                                                                                                                                                                                                                                                                                                    |
| `res`    | A strongly-typed `NextApiResponse` object that allows you to use only pre-defined status codes, `Content-Type` headers and response data formats from the current method handler.                                                                                                                                                                                                                                                                                            |
| `params` | An object containing the strongly-typed combined response of your [Global middleware](#global-middleware), [Route middleware](#route-middleware) and [Method middleware](#method-middleware). The parameters can also be overridden in the different middleware layers with the [Method middleware](#method-middleware) taking precedence over the [Route middleware](#route-middleware) and route middleware taking precedence over [Global middleware](#global-middleware) |

## [Middlewares](#middlewares)

The middleware functions can be used for any kind of middleware logic, like adding authentication etc. for your API. In addition, they can be used to add additional typed parameters for your API route handlers. They support both asynchronous and synchronous execution.

```typescript
// A global middleware, route middleware or method middleware.
middleware: () => ({
  foo: 'bar'
});
// A method handler (given that the middleware above is either in the same API route or method, or is a global middleware).
handler: ({
  params: {
    foo // string
  }
}) => {
  // Your logic.
};
```

### [Global middleware](#global-middleware)

The global middleware function takes in an object with two attributes and optionally returns an object of any form:

| Name  | Description                       |
| ----- | --------------------------------- |
| `req` |  A plain `NextApiRequest` object. |
| `res` | A plain `NextApiResponse` object. |

### [Route middleware](#route-middleware)

The route middleware function takes in an object with three attributes and optionally returns an object of any form:

| Name     | Description                                                                      |
| -------- | -------------------------------------------------------------------------------- |
| `req`    |  A plain `NextApiRequest` object.                                                |
| `res`    | A plain `NextApiResponse` object.                                                |
| `params` |  The type of an object returned by your [Global middleware](#global-middleware). |

### [Method middleware](#method-middleware)

The method middleware function takes in an object with three attributes and optionally returns an object of any form:

| Name     | Description                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`    |  A strongly-typed `NextApiRequest` object containing the typed body and query parameters of your request.                                                                         |
| `res`    | A strongly-typed `NextApiResponse` object that allows you to use only pre-defined status codes, `Content-Type` headers and response data formats from the current method handler. |
| `params` |  The type of a combined object returned by both your [Global middleware](#global-middleware) and [Route middleware](#route-middleware).                                           |

## [Error handlers](#error-handlers)

The error handler functions can be used for custom error handling. They support both asynchronous and synchronous execution.

```typescript
// A global error handler, route error handler or method error handler.
errorHandler: ({ req, res, params }) => {
  // Your error handling logic.
};
```

### [Global error handler](#global-error-handler)

The global error handler takes in an object with two attributes:

| Name  | Description                       |
| ----- | --------------------------------- |
| `req` |  A plain `NextApiRequest` object. |
| `res` | A plain `NextApiResponse` object. |

### [Route error handler](#global-error-handler)

Route error handler can be used to override your global error handler. The route error handler takes in an object with three attributes:

| Name     | Description                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `req`    |  A plain `NextApiRequest` object.                                                                                                       |
| `res`    | A plain `NextApiResponse` object.                                                                                                       |
| `params` |  The type of a combined object returned by both your [Global middleware](#global-middleware) and [Route middleware](#route-middleware). |

### [Method error handler](#global-error-handler)

Method error handler can be used to override both your global error handler and route error handler. The method error handler takes in an object with three attributes and optionally returns an object of any form:

| Name     | Description                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`    |  A strongly-typed `NextApiRequest` object containing the typed body and query parameters of your request.                                                                         |
| `res`    | A strongly-typed `NextApiResponse` object that allows you to use only pre-defined status codes, `Content-Type` headers and response data formats from the current method handler. |
| `params` |  The type of a combined object returned by your [Global middleware](#global-middleware), [Route middleware](#route-middleware) and [Method middleware](#method-middleware).       |

## [SwaggerUI config](#swaggerui-config)

The SwaggerUI config object can be used to customize the generated Swagger UI:

| Name          | Description                             |
| ------------- | --------------------------------------- |
| `title`       | Custom page title meta tag value.       |
| `description` | Custom page description meta tag value. |
| `logoHref`    | An href for a custom logo.              |
| `faviconHref` | An href for a custom favicon.           |
