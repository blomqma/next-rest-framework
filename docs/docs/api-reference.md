---
sidebar_position: 3
---

# API reference

### [Docs handler options](#docs-handler-options)

The following options can be passed to the `docsRoute` (app router) and `docsApiRoute` (pages router) functions for customizing Next REST Framework:

| Name              | Description                                                                                                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deniedPaths`     | Array of paths that are denied by Next REST Framework and not included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/disallowed-path', '/api/disallowed-path-2/*', '/api/disallowed-path-3/**']` Defaults to no paths being disallowed. |
| `allowedPaths`    | Array of paths that are allowed by Next REST Framework and included in the OpenAPI spec. Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching. Example: `['/api/allowed-path', '/api/allowed-path-2/*', '/api/allowed-path-3/**']` Defaults to all paths being allowed.               |
| `openApiObject`   | An [OpenAPI Object](https://swagger.io/specification/#openapi-object) that can be used to override and extend the auto-generated specification.                                                                                                                                                                        |
| `openApiJsonPath` | Path that will be used for fetching the OpenAPI spec - defaults to `/openapi.json`. This path also determines the path where this file will be generated inside the `public` folder.                                                                                                                                   |
| `docsConfig`      | A [Docs config](#docs-config) object for customizing the generated docs.                                                                                                                                                                                                                                               |

### [Docs config](#docs-config)

The docs config options can be used to customize the generated docs:

| Name          | Description                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`    | Determines whether to render the docs using Redoc (`redoc`) or SwaggerUI `swagger-ui`. Defaults to `redoc`.                                  |
| `title`       | Custom title, used for the visible title and HTML title.                                                                                     |
| `description` | Custom description, used for the visible description and HTML meta description.                                                              |
| `faviconUrl`  | Custom HTML meta favicon URL.                                                                                                                |
| `logoUrl`     | A URL for a custom logo.                                                                                                                     |
| `ogConfig`    | [Basic customization options](https://ogp.me/#metadata) for OG meta tags. Requires the following fields: `title`, `type`, `url`, `imageUrl`. |

### REST

#### [Route handler options](#route-handler-options)

The `routeHandler` (app router) and `apiRouteHandler` (pages router) functions allow you to pass an object as the second parameter, where you can define a property called `openApiPath`. This property is an OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification for the given route.

#### [Route operations](#route-operations)

The route operation functions `routeOperation` (app router) and `apiRouteOperation` (pages router) allow you to define your method handlers for your endpoints. These functions require you to pass an object where you will define the method for the given operation, as well as optionally a property called `openApiOperation`. This property is an OpenAPI [Operation object](https://swagger.io/specification/#operation-object) that can be used to override and extend the auto-generated specification for the given operation. Calling the `routeOperation` and `apiRouteOperation` functions allows you to chain your API handler logic with the following functions:

| Name         | Description                                                                                                                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`      | A [Route operation input](#route-operation-input) function for defining the validation and documentation of the request.                                                                                                                                             |
| `outputs`    | An [Route operation outputs](#route-operation-outputs) function for defining the validation and documentation of the response.                                                                                                                                       |
| `handler`    | A [Route operation-handler](#route-operation-handler) function for defining your business logic.                                                                                                                                                                     |
| `middleware` | A [Route operation middleware](#route-operation-middleware) function that gets executed before the request input is validated. You may chain up to three middlewares together and share data between the middlewares by taking the input of the previous middleware. |

##### [Route operation input](#route-operation-input)

The route operation input function is used for type-checking, validation and documentation of the request, taking in an object with the following properties:

| Name          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Required |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type header of the request. When the content type is defined, a request with an incorrect content type header will get an error response.                                                                                                                                                                                                                                                                                                                  | `false`  |
| `body`        | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the request body. When using `application/x-www-form-urlencoded` or `multipart/form-data` content types, this should be a `zod-form-data` schema instead. When the body schema is defined, a request with an invalid request body will get an error response. The request body is parsed using this schema and updated to the request if valid, so the body should always match the schema. | `false`  |
| `bodySchema`  | A JSON schema that you can provide in case the conversion of the `body` Zod schema fails or produces an incorrect result in your OpenAPI spec.                                                                                                                                                                                                                                                                                                                         | `false`  |
| `query`       | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the query parameters. When the query schema is defined, a request with invalid query parameters will get an error response. Query parameters are parsed using this schema and updated to the request if valid, so the query parameters from the request should always match the schema.                                                                                                     | `false`  |
| `querySchema` | A JSON schema that you can provide in case the conversion of the `query` Zod schema fails or produces an incorrect result in your OpenAPI spec.                                                                                                                                                                                                                                                                                                                        | `false`  |
| `params`      | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the path parameters. When the params schema is defined, a request with invalid path parameters will get an error response. Path parameters are parsed using this schema and updated to the request if valid, so the path parameters from the request should always match the schema.                                                                                                        | `false`  |

Calling the route operation input function allows you to chain your API handler logic with the [Route operation outputs](#route-operation-outputs), [Route operation middleware](#route-operation-middleware) and [Route operation handler](#route-operation-handler) functions.

##### [Route operation outputs](#route-operation-outputs)

The route operation outputs function is used for type-checking and documentation of the response, taking in an array of objects with the following properties:

| Name          | Description                                                                                                                                    | Required |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `status`      | A status code that your API can return.                                                                                                        | `true`   |
| `contentType` | The content type header of the response.                                                                                                       | `true`   |
| `body`        | A [Zod](https://github.com/colinhacks/zod) (or `zod-form-data`) schema describing the format of the response data.                             |  `true`  |
| `bodySchema`  | A JSON schema that you can provide in case the conversion of the `body` Zod schema fails or produces an incorrect result in your OpenAPI spec. | `false`  |
| `name`        | An optional name used in the generated OpenAPI spec for the response body, e.g. `GetTodosSuccessResponse`.                                     | `false`  |

Calling the route operation outputs function allows you to chain your API handler logic with the [Route operation middleware](#route-operation-middleware) and [Route operation handler](#route-operation-handler) functions.

##### [Route operation middleware](#route-operation-middleware)

The route operation middleware function is executed before validating the request input. The function takes in the same parameters as the Next.js [router handler](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) (app router) and [API route](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) (pages router) functions. Additionally, as a second parameter this function takes the return value of your last middleware function, defaulting to an empty object. Throwing an error inside a middleware function will stop the execution of the handler and you can also return a custom response like you would do within the [Route operation handler](#route-operation-handler) function. Calling the route operation middleware function allows you to chain your API handler logic with the [Route operation handler](#route-operation-handler) function. Alternatively, you may chain up to three middleware functions together:

```typescript
// App router.
export const { GET } = route({
  getTodos: routeOperation({ method: 'GET' })
    .middleware(() => {
      return { foo: 'bar' };
    })
    .middleware((_req, _ctx, { foo }) => {
      if (myCondition) {
        return NextResponse.json({ error: 'My error.' }, { status: 400 });
      }

      return {
        foo,
        bar: 'baz'
      };
    })
    .handler((_req, _ctx, { foo, bar }) => {
      // ...
    })
});

// Pages router.
export default apiRoute({
  getTodos: routeOperation({ method: 'GET' })
    .middleware(() => {
      return { foo: 'bar' };
    })
    .middleware((req, res, { foo }) => {
      if (myCondition) {
        res.status(400).json({ error: 'My error.' });
        return;
      }

      return {
        foo,
        bar: 'baz'
      };
    })
    .handler((req, res, { foo, bar }) => {
      // ...
    })
});
```

##### [Route operation handler](#route-operation-handler)

The route operation handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly-typed versions of the same parameters as the Next.js [router handler](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) (app router) and [API route](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) (pages router) functions. Additionally, as a third parameter this function takes the return value of your last middleware function (see above), defaulting to an empty object.

### RPC

#### [RPC route handler options](#rpc-route-handler-options)

The `rpcRouteHandler` (app router) and `rpcApiRouteHandler` (pages router) functions allow you to pass an object as the second parameter, where you can define a property called `openApiPath`. This property is an OpenAPI [Path Item Object](https://swagger.io/specification/#path-item-object) that can be used to override and extend the auto-generated specification for the given route.

#### [RPC operations](#rpc-operations)

The `rpcOperation` function allows you to define your API handlers for your RPC endpoint. This function allows you to pass an OpenAPI [Operation object](https://swagger.io/specification/#operation-object) as a parameter, that can be used to override and extend the auto-generated specification for the given operation. Calling this function allows you to chain your API handler logic with the following functions.

| Name         | Description                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`      | An [RPC operation input](#rpc-operation-input) function for defining the validation and documentation of the operation.                                                                                                                                             |
| `outputs`    | An [RPC operation outputs](#rpc-operation-outputs) function for defining the validation and documentation of the response.                                                                                                                                          |
| `handler`    | An [RPC operation handler](#rpc-operation-handler) function for defining your business logic.                                                                                                                                                                       |
| `middleware` | An [RPC operation middleware](#rpc-operation-middleware) function that gets executed before the operation input is validated. You may chain up to three middlewares together and share data between the middlewares by taking the input of the previous middleware. |

##### [RPC operation input](#rpc-operation-input)

The RPC operation input function is used for type-checking, validation and documentation of the RPC call, taking in an object with the following properties:

| Name          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Required |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `contentType` | The content type header of the request, limited to `application/json`, `application/x-www-form-urlencoded` and `multipart/form-data`. When the content type is defined, a request with an incorrect content type header will get an error response.                                                                                                                                                                                                                    | `false`  |
| `body`        | A [Zod](https://github.com/colinhacks/zod) schema describing the format of the request body. When using `application/x-www-form-urlencoded` or `multipart/form-data` content types, this should be a `zod-form-data` schema instead. When the body schema is defined, a request with an invalid request body will get an error response. The request body is parsed using this schema and updated to the request if valid, so the body should always match the schema. | `false`  |
| `bodySchema`  | A JSON schema that you can provide in case the conversion of the `body` Zod schema fails or produces an incorrect result in your OpenAPI spec.                                                                                                                                                                                                                                                                                                                         | `false`  |

Calling the RPC input function allows you to chain your API handler logic with the [RPC operation outputs](#rpc-operation-outputs), [RPC middleware](#rpc-operation-middleware) and [RPC handler](#rpc-operation-handler) functions.

##### [RPC operation outputs](#rpc-operation-outputs)

The RPC operation outputs function is used for type-checking and documentation of the response, taking in an array of objects with the following properties:

| Name         | Description                                                                                                                                    | Required |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `body`       | A [Zod](https://github.com/colinhacks/zod) (or `zod-form-data`) schema describing the format of the response data.                             |  `true`  |
| `bodySchema` | A JSON schema that you can provide in case the conversion of the `body` Zod schema fails or produces an incorrect result in your OpenAPI spec. | `false`  |
| `name`       | An optional name used in the generated OpenAPI spec for the response body, e.g. `GetTodosSuccessResponse`.                                     | `false`  |

Calling the RPC operation outputs function allows you to chain your API handler logic with the [RPC operation middleware](#rpc-operation-middleware) and [RPC operation handler](#rpc-operation-handler) functions.

##### [RPC operation middleware](#rpc-operation-middleware)

The RPC operation middleware function is executed before validating RPC operation input. The function takes in strongly typed parameters typed by the [RPC operation input](#rpc-operation-input) function. Additionally, as a second parameter this function takes the return value of your last middleware function, defaulting to an empty object. Throwing an error inside a middleware function will stop the execution of the handler. Calling the RPC operation middleware function allows you to chain your RPC API handler logic with the [RPC operation handler](#rpc-operation-handler) function. Alternatively, you may chain up to three middleware functions together:

```typescript
// App router.
export const { POST } = rpcRoute({
  getTodos: rpcOperation()
    .middleware(() => {
      return { foo: 'bar' };
    })
    .middleware((_input, { foo }) => {
      if (myCondition) {
        throw Error('My error.');
      }

      return {
        foo,
        bar: 'baz'
      };
    })
    .handler((_input, { foo, bar }) => {
      // ...
    })
});

// Pages router.
export default rpcApiRoute({
  // ... Same as above.
});
```

##### [RPC operation handler](#rpc-operation-handler)

The RPC operation handler function is a strongly-typed function to implement the business logic for your API. The function takes in strongly typed parameters typed by the [RPC operation input](#rpc-operation-input) function. Additionally, as a second parameter this function takes the return value of your last middleware function (see above), defaulting to an empty object.

## [CLI](#cli)

The Next REST Framework CLI supports generating and validating the `openapi.json` file:

- `npx next-rest-framework generate` to generate the `openapi.json` file.
- `npx next-rest-framework validate` to validate that the `openapi.json` file is up-to-date.

The `next-rest-framework validate` command is useful to have as part of the static checks in your CI/CD pipeline. Both commands support the following options:

| Name                    | Description                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--configPath <string>` | In case you have multiple docs handlers with different configurations, you can specify which configuration you want to use by providing the path to the API. Example: `/api/my-configuration`. |

A good practice is to set these in your `package.json` as both commands are needed:

```json
"scripts": {
  "generate": "next-rest-framework generate",
  "validate": "next-rest-framework validate",
}
```
