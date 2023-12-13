import { join } from 'path';
import {
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
import { type ZodObject, type ZodSchema, type ZodRawShape } from 'zod';
import { type ApiRouteOperationDefinition } from '../pages-router';
import { type RouteOperationDefinition } from '../app-router';
import { type RpcOperationDefinition } from './rpc-operation';

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
  const unordered = { ...obj };

  return Object.keys(unordered)
    .sort()
    .reduce<Record<string, unknown>>((_obj, key) => {
      _obj[key] = unordered[key];
      return _obj;
    }, {}) as T;
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

  const getCleanedRpcRoutes = (files: string[]) =>
    files.filter((file) => file.endsWith('rpc/[operationId]/route.ts'));

  let routes: string[] = [];
  let rpcRoutes: string[] = [];

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

  const getCleanedRpcApiRoutes = (files: string[]) =>
    files.filter((file) => file.endsWith('rpc/[operationId].ts'));

  try {
    // Scan `app` folder.
    const path = join(process.cwd(), 'app');

    if (existsSync(path)) {
      const files = getNestedFiles(path, '');
      routes = getCleanedRoutes(files);
      rpcRoutes = getCleanedRpcRoutes(files);
    } else {
      // Scan `src/app` folder.
      const path = join(process.cwd(), 'src/app');

      if (existsSync(path)) {
        const files = getNestedFiles(path, '');
        routes = getCleanedRoutes(files);
        rpcRoutes = getCleanedRpcRoutes(files);
      }
    }
  } catch {}

  let apiRoutes: string[] = [];
  let rpcApiRoutes: string[] = [];

  try {
    // Scan `pages/api` folder.
    const path = join(process.cwd(), 'pages/api');

    if (existsSync(path)) {
      const files = getNestedFiles(path, '');
      apiRoutes = getCleanedApiRoutes(files);
      rpcApiRoutes = getCleanedRpcApiRoutes(files);
    } else {
      // Scan `src/pages/api` folder.
      const path = join(process.cwd(), 'src/pages/api');

      if (existsSync(path)) {
        const files = getNestedFiles(path, '');
        apiRoutes = getCleanedApiRoutes(files);
        rpcApiRoutes = getCleanedRpcApiRoutes(files);
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
    [...routes, ...rpcRoutes, ...apiRoutes, ...rpcApiRoutes].map(
      async (route) => {
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
      }
    )
  );

  return {
    paths,
    schemas
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
  nrfOasData: { paths = {}, schemas = {} }
}: {
  config: Required<NextRestFrameworkConfig>;
  nrfOasData: NrfOasData;
}) => {
  const path = join(process.cwd(), 'public', config.openApiJsonPath);

  const components = Object.keys(schemas).length
    ? { components: { schemas: sortObjectByKeys(schemas) } }
    : {};

  const newSpec: OpenAPIV3_1.Document = merge(
    {
      openapi: OPEN_API_VERSION,
      info: config.openApiObject.info,
      paths: sortObjectByKeys(paths)
    },
    components,
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

export const getOasDataFromOperations = ({
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

  const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

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
        const key = `${capitalize(operationId)}RequestBody`;

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

      const usedStatusCodes: number[] = [];

      generatedOperationObject.responses = outputs?.reduce(
        (obj, { status, contentType, schema, name }) => {
          const occurrenceOfStatusCode = usedStatusCodes.includes(status)
            ? usedStatusCodes.filter((s) => s === status).length + 1
            : '';

          const key =
            name ??
            `${capitalize(
              operationId
            )}${status}ResponseBody${occurrenceOfStatusCode}`;

          usedStatusCodes.push(status);

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
              const schema: ZodSchema = (input.query as ZodObject<ZodRawShape>)
                .shape[key];

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
  route: _route
}: {
  operations: Record<string, RpcOperationDefinition<any, any, any>>;
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

  const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

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

      if (input) {
        const key = `${capitalize(operationId)}RequestBody`;
        const ref = `#/components/schemas/${key}`;

        requestBodySchemas[operationId] = {
          key,
          ref,
          schema: getJsonSchema({ schema: input })
        };

        generatedOperationObject.requestBody = {
          content: {
            'application/json': {
              schema: {
                $ref: ref
              }
            }
          }
        };
      }

      generatedOperationObject.responses = outputs?.reduce(
        (obj, { schema, name }, i) => {
          const key =
            name ??
            `${capitalize(operationId)}ResponseBody${i > 0 ? i + 1 : ''}`;

          responseBodySchemas[operationId] = [
            ...(responseBodySchemas[operationId] ?? []),
            {
              key,
              ref: `#/components/schemas/${key}`,
              schema: getJsonSchema({ schema })
            }
          ];

          return Object.assign(obj, {
            200: {
              description: key,
              content: {
                'application/json': {
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
