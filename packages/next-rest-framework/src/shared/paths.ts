import { type OpenApiPathItem, type OpenApiOperation } from '../types';
import { type OpenAPIV3_1 } from 'openapi-types';
import { DEFAULT_ERRORS } from '../constants';
import { merge } from 'lodash';

import { getJsonSchema } from './schemas';
import { type ZodObject, type ZodSchema, type ZodRawShape } from 'zod';
import { type ApiRouteOperationDefinition } from '../pages-router';
import { type RouteOperationDefinition } from '../app-router';
import { type RpcOperationDefinition } from './rpc-operation';
import { capitalizeFirstLetter, isValidMethod } from './utils';

const isSchemaRef = (
  schema: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject
): schema is OpenAPIV3_1.ReferenceObject => '$ref' in schema;

export interface NrfOasData {
  paths?: OpenAPIV3_1.PathsObject;
  schemas?: Record<string, OpenAPIV3_1.SchemaObject>;
}

// Get OpenAPI paths from a route or API route.
export const getPathsFromRoute = ({
  operations,
  options,
  route
}: {
  operations: Record<
    string,
    RouteOperationDefinition | ApiRouteOperationDefinition
  >;
  options?: { openApiPath?: OpenApiPathItem };
  route: string;
}): NrfOasData => {
  const paths: OpenAPIV3_1.PathsObject = {};

  paths[route] = {
    ...options?.openApiPath
  };

  const requestBodySchemas: Record<
    string,
    { key: string; ref: string; schema: OpenAPIV3_1.SchemaObject }
  > = {};

  const responseBodySchemas: Record<
    string,
    Array<{ key: string; ref: string; schema: OpenAPIV3_1.SchemaObject }>
  > = {};

  Object.entries(operations).forEach(
    ([operationId, { openApiOperation, method: _method, input, outputs }]: [
      string,
      RouteOperationDefinition | ApiRouteOperationDefinition
    ]) => {
      if (!isValidMethod(_method)) {
        return;
      }

      const method = _method?.toLowerCase();

      const generatedOperationObject: OpenAPIV3_1.OperationObject = {
        operationId
      };

      if (input?.body && input?.contentType) {
        const key = `${capitalizeFirstLetter(operationId)}RequestBody`;

        const schema =
          input.bodySchema ??
          getJsonSchema({
            schema: input.body,
            operationId,
            type: 'input-body'
          });

        const ref = isSchemaRef(schema)
          ? schema.$ref
          : `#/components/schemas/${key}`;

        if (!isSchemaRef(schema)) {
          requestBodySchemas[method] = {
            key,
            ref,
            schema
          };
        }

        generatedOperationObject.requestBody = {
          content: {
            [input.contentType]: {
              schema: {
                $ref: ref
              }
            }
          }
        };
      }

      const usedStatusCodes: number[] = [];

      generatedOperationObject.responses = outputs?.reduce(
        (obj, { status, contentType, body, bodySchema, name }) => {
          const occurrenceOfStatusCode = usedStatusCodes.includes(status)
            ? usedStatusCodes.filter((s) => s === status).length + 1
            : '';

          const key =
            name ??
            `${capitalizeFirstLetter(
              operationId
            )}${status}ResponseBody${occurrenceOfStatusCode}`;

          usedStatusCodes.push(status);

          const schema =
            bodySchema ??
            getJsonSchema({
              schema: body,
              operationId,
              type: 'output-body'
            });

          const ref = isSchemaRef(schema)
            ? schema.$ref
            : `#/components/schemas/${key}`;

          if (!isSchemaRef(schema)) {
            responseBodySchemas[method] = [
              ...(responseBodySchemas[method] ?? []),
              {
                key,
                ref,
                schema
              }
            ];
          }

          return Object.assign(obj, {
            [status]: {
              description: `Response for status ${status}`,
              content: {
                [contentType]: {
                  schema: {
                    $ref: ref
                  }
                }
              }
            }
          });
        },
        {
          500: {
            description: DEFAULT_ERRORS.unexpectedError,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/UnexpectedError`
                }
              }
            }
          }
        }
      );

      const pathParameters = route
        .match(/{([^}]+)}/g)
        ?.map((param) => param.replace(/[{}]/g, ''));

      if (pathParameters) {
        generatedOperationObject.parameters = pathParameters.map((name) => ({
          name,
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }));
      }

      if (input?.query) {
        const schema =
          input.querySchema ??
          getJsonSchema({
            schema: input.query,
            operationId,
            type: 'input-query'
          }).properties ??
          {};

        generatedOperationObject.parameters = [
          ...(generatedOperationObject.parameters ?? []),
          ...Object.entries(schema)
            // Filter out query parameters that have already been added to the path parameters automatically.
            .filter(([name]) => !pathParameters?.includes(name))
            .map(([name, schema]) => {
              const _schema = (input.query as ZodObject<ZodRawShape>).shape[
                name
              ] as ZodSchema;

              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              return {
                name,
                in: 'query',
                required: !_schema.isOptional(),
                schema
              } as OpenAPIV3_1.ParameterObject;
            })
        ];
      }

      paths[route] = {
        ...paths[route],
        [method]: merge(generatedOperationObject, openApiOperation)
      };
    }
  );

  const requestBodySchemaMapping = Object.values(requestBodySchemas).reduce<
    Record<string, OpenAPIV3_1.SchemaObject>
  >((acc, { key, schema }) => {
    acc[key] = schema;
    return acc;
  }, {});

  const responseBodySchemaMapping = Object.values(responseBodySchemas)
    .flatMap((val) => val)
    .reduce<Record<string, OpenAPIV3_1.SchemaObject>>(
      (acc, { key, schema }) => {
        acc[key] = schema;
        return acc;
      },
      {
        UnexpectedError: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          },
          additionalProperties: false
        }
      }
    );

  const schemas: Record<string, OpenAPIV3_1.SchemaObject> = {
    ...requestBodySchemaMapping,
    ...responseBodySchemaMapping
  };

  return { paths, schemas };
};

// Get OpenAPI paths from an RPC route or RPC API route.
export const getPathsFromRpcRoute = ({
  operations,
  options,
  route: _route
}: {
  operations: Record<string, RpcOperationDefinition<any, any, any, any>>;
  options?: {
    openApiPath?: OpenApiPathItem;
    openApiOperation?: OpenApiOperation;
  };
  route: string;
}): NrfOasData => {
  const paths: OpenAPIV3_1.PathsObject = {};

  const requestBodySchemas: Record<
    string,
    {
      key: string;
      ref: string;
      schema: OpenAPIV3_1.SchemaObject;
    }
  > = {};

  const responseBodySchemas: Record<
    string,
    Array<{
      key: string;
      ref: string;
      schema: OpenAPIV3_1.SchemaObject;
    }>
  > = {};

  Object.entries(operations).forEach(
    ([
      operationId,
      {
        _meta: { openApiOperation, input, outputs }
      }
    ]) => {
      const route = _route + `/${operationId}`;

      paths[route] = {
        ...options?.openApiPath
      };

      const generatedOperationObject: OpenAPIV3_1.OperationObject = {
        operationId
      };

      if (input?.body && input.contentType) {
        const key = `${capitalizeFirstLetter(operationId)}RequestBody`;

        const schema =
          input.bodySchema ??
          getJsonSchema({
            schema: input.body,
            operationId,
            type: 'input-body'
          });

        const ref = isSchemaRef(schema)
          ? schema.$ref
          : `#/components/schemas/${key}`;

        if (!isSchemaRef(schema)) {
          requestBodySchemas[operationId] = {
            key,
            ref,
            schema
          };
        }

        generatedOperationObject.requestBody = {
          content: {
            [input.contentType]: {
              schema: {
                $ref: ref
              }
            }
          }
        };
      }

      generatedOperationObject.responses = outputs?.reduce(
        (obj, { body, bodySchema, contentType, name }, i) => {
          const key =
            name ??
            `${capitalizeFirstLetter(operationId)}ResponseBody${
              i > 0 ? i + 1 : ''
            }`;

          const schema =
            bodySchema ??
            getJsonSchema({
              schema: body,
              operationId,
              type: 'output-body'
            });

          const ref = isSchemaRef(schema)
            ? schema.$ref
            : `#/components/schemas/${key}`;

          if (!isSchemaRef(schema)) {
            responseBodySchemas[operationId] = [
              ...(responseBodySchemas[operationId] ?? []),
              {
                key,
                ref,
                schema
              }
            ];
          }

          return Object.assign(obj, {
            200: {
              description: key,
              content: {
                [contentType]: {
                  schema: {
                    $ref: ref
                  }
                }
              }
            }
          });
        },
        {
          400: {
            description: DEFAULT_ERRORS.unexpectedError,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/UnexpectedError`
                }
              }
            }
          }
        }
      );

      paths[route] = {
        ...paths[route],
        ['post' as OpenAPIV3_1.HttpMethods]: merge(
          generatedOperationObject,
          openApiOperation
        )
      };
    }
  );

  const requestBodySchemaMapping = Object.values(requestBodySchemas).reduce<
    Record<string, OpenAPIV3_1.SchemaObject>
  >((acc, { key, schema }) => {
    acc[key] = schema;
    return acc;
  }, {});

  const responseBodySchemaMapping = Object.values(responseBodySchemas)
    .flatMap((val) => val)
    .reduce<Record<string, OpenAPIV3_1.SchemaObject>>(
      (acc, { key, schema }) => {
        acc[key] = schema;
        return acc;
      },
      {
        UnexpectedError: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          },
          additionalProperties: false
        }
      }
    );

  const schemas: Record<string, OpenAPIV3_1.SchemaObject> = {
    ...requestBodySchemaMapping,
    ...responseBodySchemaMapping
  };

  return { paths, schemas };
};
