import { type OpenApiPathItem, type OpenApiOperation } from '../types';
import { type OpenAPIV3_1 } from 'openapi-types';
import {
  ERROR_MESSAGE_SCHEMA,
  INVALID_PATH_PARAMETERS_RESPONSE,
  INVALID_QUERY_PARAMETERS_RESPONSE,
  INVALID_REQUEST_BODY_RESPONSE,
  INVALID_RPC_REQUEST_RESPONSE,
  MESSAGE_WITH_ERRORS_SCHEMA,
  UNEXPECTED_ERROR_RESPONSE
} from '../constants';
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

  const baseResponseBodySchemaMapping: Record<
    string,
    OpenAPIV3_1.SchemaObject
  > = {
    ErrorMessage: ERROR_MESSAGE_SCHEMA
  };

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

        const description =
          input.bodySchema?.description ?? input.body._def.description;

        if (description) {
          generatedOperationObject.requestBody.description = description;
        }
      }

      const usedStatusCodes: number[] = [];

      const baseOperationResponses: OpenAPIV3_1.ResponsesObject = {
        500: UNEXPECTED_ERROR_RESPONSE
      };

      if (input?.bodySchema) {
        baseOperationResponses[400] = INVALID_REQUEST_BODY_RESPONSE;

        baseResponseBodySchemaMapping.MessageWithErrors =
          MESSAGE_WITH_ERRORS_SCHEMA;
      }

      if (input?.querySchema) {
        baseOperationResponses[400] = INVALID_QUERY_PARAMETERS_RESPONSE;

        baseResponseBodySchemaMapping.InvalidQueryParameters =
          MESSAGE_WITH_ERRORS_SCHEMA;
      }

      if (input?.paramsSchema) {
        baseOperationResponses[400] = INVALID_PATH_PARAMETERS_RESPONSE;

        baseResponseBodySchemaMapping.InvalidPathParameters =
          MESSAGE_WITH_ERRORS_SCHEMA;
      }

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

          const description =
            bodySchema?.description ??
            body._def.description ??
            `Response for status ${status}`;

          return Object.assign(obj, {
            [status]: {
              description,
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
        baseOperationResponses
      );

      let pathParameters: OpenAPIV3_1.ParameterObject[] = [];

      if (input?.params) {
        const schema =
          input.paramsSchema ??
          getJsonSchema({
            schema: input.params,
            operationId,
            type: 'input-params'
          }).properties ??
          {};

        pathParameters = Object.entries(schema).map(([name, schema]) => {
          const _schema = (input.params as ZodObject<ZodRawShape>).shape[
            name
          ] as ZodSchema;

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          return {
            name,
            in: 'path',
            required: !_schema.isOptional(),
            schema
          } as OpenAPIV3_1.ParameterObject;
        });

        generatedOperationObject.parameters = [
          ...(generatedOperationObject.parameters ?? []),
          ...pathParameters
        ];
      }

      const automaticPathParameters = route
        .match(/{([^}]+)}/g)
        ?.map((param) => param.replace(/[{}]/g, ''))
        // Filter out path parameters that have been explicitly defined.
        .filter((_name) => !pathParameters?.some(({ name }) => name === _name));

      if (automaticPathParameters?.length) {
        generatedOperationObject.parameters = [
          ...(generatedOperationObject.parameters ?? []),
          ...(automaticPathParameters.map((name) => ({
            name,
            in: 'path',
            required: true,
            schema: { type: 'string' }
          })) as OpenAPIV3_1.ParameterObject[])
        ];
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
          ...Object.entries(schema).map(([name, schema]) => {
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
      baseResponseBodySchemaMapping
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

  const baseResponseBodySchemaMapping: Record<
    string,
    OpenAPIV3_1.SchemaObject
  > = {
    ErrorMessage: ERROR_MESSAGE_SCHEMA
  };

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

      const baseOperationResponses: OpenAPIV3_1.ResponsesObject = {};

      if (input?.bodySchema) {
        baseOperationResponses[400] = INVALID_RPC_REQUEST_RESPONSE;
        baseResponseBodySchemaMapping.MessageWithErrors =
          MESSAGE_WITH_ERRORS_SCHEMA;
      } else {
        baseOperationResponses[400] = UNEXPECTED_ERROR_RESPONSE;
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
        baseOperationResponses
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
      baseResponseBodySchemaMapping
    );

  const schemas: Record<string, OpenAPIV3_1.SchemaObject> = {
    ...requestBodySchemaMapping,
    ...responseBodySchemaMapping
  };

  return { paths, schemas };
};
