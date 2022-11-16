import { readdirSync } from 'fs';
import { join } from 'path';
import { OpenAPIV3_1 } from 'openapi-types';
import { MethodHandler, NextRestFrameworkConfig } from './types';
import zodToJsonSchema from 'zod-to-json-schema';
import yupToJsonSchema from '@sodaru/yup-to-json-schema';
import * as z from 'zod';
import { DEFAULT_ERRORS } from './constants';
import { isValidMethod, isYupSchema, isZodSchema } from './utils';
import chalk from 'chalk';

export const DEFAULT_RESPONSES: OpenAPIV3_1.ResponsesObject = {
  500: {
    description: DEFAULT_ERRORS.unexpectedError,
    content: {
      'application/json': {
        schema: zodToJsonSchema<string>(z.object({ message: z.string() }))
      }
    }
  }
};

const convertSchemaToJsonSchema = (
  _schema: unknown
): OpenAPIV3_1.SchemaObject => {
  let schema: OpenAPIV3_1.SchemaObject = {};

  if (isZodSchema(_schema)) {
    schema = zodToJsonSchema(_schema) as OpenAPIV3_1.SchemaObject;
  } else if (isYupSchema(_schema)) {
    schema = yupToJsonSchema(_schema) as OpenAPIV3_1.SchemaObject;
  } else {
    console.warn(
      chalk.yellowBright(
        "Warning: Unsupported schema type. Can't convert to JSON Schema."
      )
    );
  }

  return schema;
};

export const generatePaths = async <GlobalMiddlewareResponse>({
  config: { openApiJsonPath, openApiYamlPath, swaggerUiPath }
}: {
  config: NextRestFrameworkConfig<GlobalMiddlewareResponse>;
}): Promise<OpenAPIV3_1.PathsObject> => {
  const paths: OpenAPIV3_1.PathsObject = {};

  const filterApiRoutes = (file: string) => {
    const isCatchAllRoute = file.includes('...');

    const isOpenApiJsonRoute = file.endsWith(
      `${openApiJsonPath?.split('/').at(-1)}.ts`
    );

    const isOpenApiYamlRoute = file.endsWith(
      `${openApiYamlPath?.split('/').at(-1)}.ts`
    );

    const isSwaggerUiRoute = file.endsWith(
      `${swaggerUiPath?.split('/').at(-1)}.ts`
    );

    if (
      isCatchAllRoute ||
      isOpenApiJsonRoute ||
      isOpenApiYamlRoute ||
      isSwaggerUiRoute
    ) {
      return false;
    } else {
      return true;
    }
  };

  const mapApiRoutes = readdirSync(join(process.cwd(), 'pages/api'))
    .filter(filterApiRoutes)
    .map((file) => {
      const basePath = `/api/${file}`;

      // Keep file extension for files like `openapi.json.ts`.
      if (basePath.split('.').length < 3) {
        return basePath.replace('.ts', '');
      } else {
        return basePath;
      }
    })
    .map((file) => ({
      route: file.replace('/index', '').replace('[', '{').replace(']', '}'),
      file
    }));

  await Promise.all(
    mapApiRoutes.map(async ({ file, route }) => {
      // const path = `../../../${
      //   process.env.NODE_ENV === "development" ? "apps/dev/" : ""
      // }pages${filename}`;

      const { default: handler } = await import(
        `../../../apps/dev/pages${file}`
      );

      const params = await handler();

      paths[route] = {
        $ref: params.$ref,
        summary: params.summary,
        description: params.description,
        servers: params.servers,
        parameters: params.parameters
      };

      Object.keys(params)
        .filter(isValidMethod)
        .forEach((method) => {
          const {
            tags,
            summary,
            description,
            externalDocs,
            operationId,
            parameters,
            requestBody: _requestBody,
            responses: _responses,
            callbacks,
            deprecated,
            security,
            servers
          }: MethodHandler = params[method];

          let requestBody: OpenAPIV3_1.OperationObject['requestBody'];

          if (_requestBody) {
            const {
              description,
              required,
              contentType,
              schema: _schema,
              examples,
              example,
              encoding
            } = _requestBody;

            const schema = convertSchemaToJsonSchema(_schema);

            requestBody = {
              description,
              required,
              content: {
                [contentType]: {
                  schema,
                  examples,
                  example,
                  encoding
                }
              }
            };
          } else {
            requestBody = _requestBody;
          }

          const responses: OpenAPIV3_1.ResponsesObject = {
            ...DEFAULT_RESPONSES
          };

          _responses.forEach(
            ({
              status,
              contentType,
              description = 'Auto-generated description by Next REST Framework.',
              headers,
              links,
              schema: _schema,
              example,
              examples,
              encoding
            }) => {
              if (status) {
                const schema = convertSchemaToJsonSchema(_schema);

                responses[status.toString()] = {
                  description,
                  headers,
                  links,
                  content: {
                    [contentType]: {
                      schema,
                      example,
                      examples,
                      encoding
                    }
                  }
                };
              }
            }
          );

          paths[route] = {
            ...paths[route],
            [method.toLowerCase()]: {
              tags,
              summary,
              description,
              externalDocs,
              operationId,
              parameters,
              requestBody,
              responses,
              callbacks,
              deprecated,
              security,
              servers
            }
          };
        });
    })
  );

  return paths;
};
