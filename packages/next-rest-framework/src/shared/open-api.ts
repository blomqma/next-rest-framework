import { join } from 'path';
import {
  type OutputObject,
  type NextRestFrameworkConfig,
  type OpenApiPathItem,
  type OpenApiOperation
} from '../types';
import { type OpenAPIV3_1 } from 'openapi-types';
import {
  DEFAULT_ERRORS,
  NEXT_REST_FRAMEWORK_USER_AGENT,
  OPEN_API_VERSION,
  ValidMethod
} from '../constants';
import { merge, isEqualWith } from 'lodash';
import { getJsonSchema, getSchemaKeys } from './schemas';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import * as prettier from 'prettier';
import { type ApiRouteParams } from '../pages-router';
import { type RouteOperationDefinition, type RouteParams } from '../app-router';
import { type OperationDefinition } from './rpc-operation';
import { type ZodObject, type ZodSchema, type ZodRawShape } from 'zod';

// Traverse the base path and find all nested files.
export const getNestedFiles = (basePath: string, dir: string): string[] => {
  const dirents = readdirSync(join(basePath, dir), { withFileTypes: true });

  const files = dirents.map((dirent) => {
    const res = join(dir, dirent.name);
    return dirent.isDirectory() ? getNestedFiles(basePath, res) : res;
  });

  return files.flat();
};

// Match wildcard paths with single or multiple segments.
export const isWildcardMatch = ({
  pattern,
  path
}: {
  pattern: string;
  path: string;
}) => {
  const regexPattern = pattern
    .split('/')
    .map((segment) =>
      segment === '*' ? '[^/]*' : segment === '**' ? '.*' : segment
    )
    .join('/');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
};

export const getRouteName = (file: string) =>
  `/${file}`
    .replace('/route.js', '')
    .replace('/route.ts', '')
    .replace(/\\/g, '/')
    .replaceAll('[', '{')
    .replaceAll(']', '}');

export const getApiRouteName = (file: string) =>
  `/api/${file}`
    .replace('/index', '')
    .replace(/\\/g, '/')
    .replaceAll('[', '{')
    .replaceAll(']', '}')
    .replace('.js', '')
    .replace('.ts', '');

export const logIgnoredPaths = (paths: string[]) => {
  console.info(
    chalk.yellowBright(
      `The following paths are ignored by Next REST Framework: ${chalk.bold(
        paths.map((p) => `\n- ${p}`)
      )}`
    )
  );
};

export const sortObjectByKeys = <T extends Record<string, unknown>>(
  obj: T
): T => {
  const sortedEntries = Object.entries(obj).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return Object.fromEntries(sortedEntries) as T;
};

export interface NrfOasData {
  paths?: OpenAPIV3_1.PathsObject;
  schemas?: Record<string, OpenAPIV3_1.SchemaObject>;
}

// Fetch OAS information from the Next.js routes and API routes when running the dev server.
export const fetchOasDataFromDev = async ({
  config,
  baseUrl,
  url
}: {
  config: Required<NextRestFrameworkConfig>;
  baseUrl: string;
  url: string;
}): Promise<NrfOasData> => {
  // Disable TLS certificate validation in development mode to enable local development using HTTPS.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const ignoredPaths: string[] = [];

  // Check if the route is allowed or denied by the user.
  const isAllowedRoute = (path: string) => {
    const isAllowed = config.allowedPaths.some((allowedPath) =>
      isWildcardMatch({ pattern: allowedPath, path })
    );

    const isDenied = config.deniedPaths.some((deniedPath) =>
      isWildcardMatch({ pattern: deniedPath, path })
    );

    const routeIsAllowed = isAllowed && !isDenied;

    if (!routeIsAllowed) {
      ignoredPaths.push(path);
    }

    return routeIsAllowed;
  };

  /*
   * Clean and filter the routes to paths:
   * - Remove any routes that are not API routes.
   * - Remove catch-all routes.
   * - Remove the current route used for docs.
   * - Replace back slashes, square brackets etc.
   * - Filter disallowed routes.
   */
  const getCleanedRoutes = (files: string[]) =>
    files
      .filter((file) => file.endsWith('route.ts'))
      .filter((file) => !file.includes('[...'))
      .filter((file) => file !== `${url.split('/').at(-1)}/route.ts`)
      .map(getRouteName)
      .filter(isAllowedRoute);

  let routes: string[] = [];

  /*
   * Clean and filter the API routes to paths:
   * - Remove catch-all routes.
   * - Add the `/api` prefix.
   * - Replace back slashes, square brackets etc.
   * - Filter the current route used for docs.
   * - Filter disallowed routes.
   */
  const getCleanedApiRoutes = (files: string[]) =>
    files
      .filter((file) => !file.includes('[...'))
      .map(getApiRouteName)
      .filter((route) => route !== `/${url.split('/').at(-1)}`)
      .filter(isAllowedRoute);

  try {
    // Scan `app` folder.
    const path = join(process.cwd(), 'app');

    if (existsSync(path)) {
      routes = getCleanedRoutes(getNestedFiles(path, ''));
    } else {
      // Scan `src/app` folder.
      const path = join(process.cwd(), 'src/app');

      if (existsSync(path)) {
        routes = getCleanedRoutes(getNestedFiles(path, ''));
      }
    }
  } catch {}

  let apiRoutes: string[] = [];

  try {
    // Scan `pages/api` folder.
    const path = join(process.cwd(), 'pages/api');

    if (existsSync(path)) {
      apiRoutes = getCleanedApiRoutes(getNestedFiles(path, ''));
    } else {
      // Scan `src/pages/api` folder.
      const path = join(process.cwd(), 'src/pages/api');

      if (existsSync(path)) {
        apiRoutes = getCleanedApiRoutes(getNestedFiles(path, ''));
      }
    }
  } catch {}

  if (!config.suppressInfo && ignoredPaths.length) {
    logIgnoredPaths(ignoredPaths);
  }

  let paths: OpenAPIV3_1.PathsObject = {};
  let schemas: Record<string, OpenAPIV3_1.SchemaObject> = {};

  // Call the API routes to get the OpenAPI paths.
  await Promise.all(
    [...routes, ...apiRoutes].map(async (route) => {
      const url = `${baseUrl}${route}`;

      const fetchWithMethod = async (method: string) => {
        const controller = new AbortController();

        const abortRequest = setTimeout(() => {
          controller.abort();
        }, 5000);

        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': NEXT_REST_FRAMEWORK_USER_AGENT,
              'Content-Type': 'application/json',
              'x-forwarded-proto': baseUrl.split('://')[0],
              host: baseUrl.split('://')[1]
            },
            signal: controller.signal,
            method
          });

          clearTimeout(abortRequest);

          const data: {
            nrfOasData?: Partial<NrfOasData>;
          } = await res.json();

          if (res.status === 200 && data.nrfOasData) {
            paths = { ...paths, ...data.nrfOasData.paths };
            schemas = { ...schemas, ...data.nrfOasData.schemas };
          }

          return true;
        } catch {
          // A user defined API route returned an error.
        }

        return false;
      };

      // The API routes can export any methods - test them all until a successful response is returned.
      for (const method of Object.keys(ValidMethod)) {
        const shouldBreak = await fetchWithMethod(method);

        if (shouldBreak) {
          break;
        }
      }
    })
  );

  return {
    paths: sortObjectByKeys(paths),
    schemas: sortObjectByKeys(schemas)
  };
};

export const generateOpenApiSpec = async ({
  path,
  spec
}: {
  path: string;
  spec: Record<string, unknown>;
}) => {
  try {
    if (!existsSync(join(process.cwd(), 'public'))) {
      console.info(
        chalk.redBright(
          'The `public` folder was not found. Generating OpenAPI spec aborted.'
        )
      );

      return;
    }

    const jsonSpec = await prettier.format(JSON.stringify(spec), {
      parser: 'json'
    });

    writeFileSync(path, jsonSpec, null);
    console.info(chalk.green('OpenAPI spec generated successfully!'));
  } catch (e) {
    console.error(chalk.red(`Error while generating the API spec: ${e}`));
  }
};

export const syncOpenApiSpec = async ({
  config,
  nrfOasData: { paths, schemas }
}: {
  config: Required<NextRestFrameworkConfig>;
  nrfOasData: NrfOasData;
}) => {
  const path = join(process.cwd(), 'public', config.openApiJsonPath);

  const newSpec: OpenAPIV3_1.Document = merge(
    {
      openapi: OPEN_API_VERSION,
      info: config.openApiObject.info,
      paths,
      components: { schemas }
    },
    config.openApiObject as OpenAPIV3_1.Document
  );

  try {
    const data = readFileSync(path);
    const openApiSpec = JSON.parse(data.toString());

    if (!isEqualWith(openApiSpec, newSpec)) {
      console.info(
        chalk.yellowBright(
          'OpenAPI spec changed, regenerating `openapi.json`...'
        )
      );

      await generateOpenApiSpec({ path, spec: newSpec });
    } else {
      console.info(
        chalk.green('OpenAPI spec up to date, skipping generation.')
      );
    }
  } catch {
    console.info(
      chalk.yellowBright('No OpenAPI spec found, generating `openapi.json`...')
    );

    await generateOpenApiSpec({ path, spec: newSpec });
  }
};

export const isValidMethod = (x: unknown): x is ValidMethod =>
  Object.values(ValidMethod).includes(x as ValidMethod);

export const getOasDataFromMethodHandlers = ({
  methodHandlers,
  route
}: {
  methodHandlers: RouteParams | ApiRouteParams;
  route: string;
}): NrfOasData => {
  const { openApiPath } = methodHandlers;
  const paths: OpenAPIV3_1.PathsObject = {};

  paths[route] = {
    ...openApiPath
  };

  const requestBodySchemas: Record<
    string,
    { key: string; ref: string; schema: OpenAPIV3_1.SchemaObject }
  > = {};

  const responseBodySchemas: Record<
    string,
    Array<{ key: string; ref: string; schema: OpenAPIV3_1.SchemaObject }>
  > = {};

  const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

  const getSchemaNameFromRoute = () => {
    const routeComponents = route
      .split('/')
      .filter((c) => !c.startsWith('{') && c !== '');

    if (routeComponents.length === 0) {
      return '';
    }

    const lastComponent = routeComponents[routeComponents.length - 1];
    return lastComponent.charAt(0).toUpperCase() + lastComponent.slice(1);
  };

  Object.entries(methodHandlers)
    .filter(([method]) => isValidMethod(method))
    .forEach(
      ([
        _method,
        {
          _meta: { openApiOperation, input, outputs }
        }
      ]: [string, RouteOperationDefinition]) => {
        const method = _method.toLowerCase();
        const generatedOperationObject: OpenAPIV3_1.OperationObject = {};

        if (input?.body && input?.contentType) {
          const key = `${capitalize(
            method
          )}${getSchemaNameFromRoute()}RequestBody`;
          const schema = getJsonSchema({ schema: input.body });

          requestBodySchemas[method] = {
            key,
            ref: `#/components/schemas/${key}`,
            schema
          };

          generatedOperationObject.requestBody = {
            content: {
              [input.contentType]: {
                schema: {
                  $ref: `#/components/schemas/${key}`
                }
              }
            }
          };
        }

        const mapResponses = (outputs: OutputObject[]) =>
          outputs.reduce(
            (obj, { status, contentType, schema, name }, i) => {
              const key =
                name ??
                `${capitalize(method)}${getSchemaNameFromRoute()}${
                  status >= 400 ? 'Error' : ''
                }ResponseBody${i > 0 ? i + 1 : ''}`;

              responseBodySchemas[method] = [
                ...(responseBodySchemas[method] ?? []),
                {
                  key,
                  ref: `#/components/schemas/${key}`,
                  schema: getJsonSchema({ schema })
                }
              ];

              return Object.assign(obj, {
                [status]: {
                  description: `Response for status ${status}`,
                  content: {
                    [contentType]: {
                      schema: {
                        $ref: `#/components/schemas/${key}`
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

        generatedOperationObject.responses = {
          ...mapResponses(outputs?.filter(({ status }) => status < 400) ?? []),
          ...mapResponses(outputs?.filter(({ status }) => status >= 400) ?? [])
        };

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
          generatedOperationObject.parameters = [
            ...(generatedOperationObject.parameters ?? []),
            ...getSchemaKeys({
              schema: input.query
            })
              // Filter out query parameters that have already been added to the path parameters automatically.
              .filter((key) => !pathParameters?.includes(key))
              .map((key) => {
                const schema: ZodSchema = (
                  input.query as ZodObject<ZodRawShape>
                ).shape[key];

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                return {
                  name: key,
                  in: 'query',
                  required: !schema.isOptional(),
                  schema: getJsonSchema({ schema })
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

export const getOasDataFromRpcOperations = ({
  operations,
  options,
  route
}: {
  operations: Record<string, OperationDefinition<any, any>>;
  options?: {
    openApiPath?: OpenApiPathItem;
    openApiOperation?: OpenApiOperation;
  };
  route: string;
}): NrfOasData => {
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

  const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

  Object.entries(operations).forEach(
    ([
      operation,
      {
        _meta: { input, outputs }
      }
    ]: [string, OperationDefinition]) => {
      if (input) {
        const key = `${capitalize(operation)}Body`;

        requestBodySchemas[operation] = {
          key,
          ref: `#/components/schemas/${key}`,
          schema: getJsonSchema({ schema: input })
        };
      }

      if (outputs) {
        responseBodySchemas[operation] = outputs.reduce<
          Array<{
            key: string;
            ref: string;
            schema: OpenAPIV3_1.SchemaObject;
          }>
        >((acc, curr, i) => {
          const key =
            curr.name ??
            `${capitalize(operation)}Response${i > 0 ? i + 1 : ''}`;

          return [
            ...acc,
            {
              key,
              ref: `#/components/schemas/${key}`,
              schema: getJsonSchema({ schema: curr.schema })
            }
          ];
        }, []);
      }
    }
  );

  const requestBodySchemaRefMapping = Object.entries(requestBodySchemas).reduce<
    Record<string, string>
  >((acc, [key, val]) => {
    acc[key] = val.ref;
    return acc;
  }, {});

  const responseBodySchemaRefMapping = Object.entries(
    requestBodySchemas
  ).reduce<Record<string, string>>((acc, [key, val]) => {
    acc[key] = val.ref;
    return acc;
  }, {});

  const rpcOperation: OpenAPIV3_1.OperationObject = {
    description: 'RPC endpoint',
    tags: ['RPC'],
    operationId: 'rpcCall',
    parameters: [
      {
        name: 'X-RPC-Operation',
        in: 'header',
        schema: {
          type: 'string'
        },
        required: true,
        description: 'The RPC operation to call.'
      }
    ],
    // eslint-disable-next-line
    requestBody: {
      content: {
        'application/json': {
          schema: {
            discriminator: {
              propertyName: 'X-RPC-Operation',
              mapping: requestBodySchemaRefMapping
            },
            oneOf: Object.values(requestBodySchemas).map(({ ref }) => ({
              $ref: ref
            }))
          }
        }
      }
    } as OpenAPIV3_1.RequestBodyObject,
    responses: {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              discriminator: {
                propertyName: 'X-RPC-Operation',
                mapping: responseBodySchemaRefMapping
              },
              oneOf: Object.values(responseBodySchemas).flatMap((val) => [
                ...val.map(({ ref }) => ({ $ref: ref }))
              ])
            }
          }
        }
      },
      '500': {
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
  };

  const paths: OpenAPIV3_1.PathsObject = {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    [route]: merge(
      {
        ...operations.openApiPath,
        post: merge(rpcOperation, options?.openApiOperation)
      },
      options?.openApiPath
    ) as OpenAPIV3_1.PathItemObject
  };

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

  return {
    paths,
    schemas
  };
};
