import { join } from 'path';
import {
  type ApiRouteParams,
  type RouteParams,
  type NextRestFrameworkConfig
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
import prettier from 'prettier';

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
    .replace('[', '{')
    .replace(']', '}');

export const getApiRouteName = (file: string) =>
  `/api/${file}`
    .replace('/index', '')
    .replace(/\\/g, '/')
    .replace('[', '{')
    .replace(']', '}')
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

export const getSortedPaths = (paths: OpenAPIV3_1.PathsObject) => {
  const sortedPathKeys = Object.keys(paths).sort();
  const sortedPaths: typeof paths = {};

  for (const key of sortedPathKeys) {
    sortedPaths[key] = paths[key];
  }

  return sortedPaths;
};

// Generate the OpenAPI paths from the Next.js routes and API routes when running the dev server.
export const generatePathsFromDev = async ({
  config,
  baseUrl,
  url
}: {
  config: Required<NextRestFrameworkConfig>;
  baseUrl: string;
  url: string;
}): Promise<OpenAPIV3_1.PathsObject> => {
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

  // Call the API routes to get the OpenAPI paths.
  await Promise.all(
    [...routes, ...apiRoutes].map(async (route) => {
      const url = `${baseUrl}${route}`;
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
          signal: controller.signal
        });

        clearTimeout(abortRequest);

        const data: {
          nextRestFrameworkPaths: Record<string, OpenAPIV3_1.PathItemObject>;
        } = await res.json();

        const isPathItemObject = (
          obj: unknown
        ): obj is OpenAPIV3_1.PathItemObject => {
          return (
            !!obj && typeof obj === 'object' && 'nextRestFrameworkPaths' in obj
          );
        };

        if (res.status === 200 && isPathItemObject(data)) {
          paths = { ...paths, ...data.nextRestFrameworkPaths };
        }
      } catch {
        // A user defined API route returned an error.
      }
    })
  );

  return getSortedPaths(paths);
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
  paths
}: {
  config: Required<NextRestFrameworkConfig>;
  paths: OpenAPIV3_1.PathsObject;
}) => {
  const path = join(process.cwd(), 'public', config.openApiJsonPath);

  const newSpec = merge(
    {
      openapi: OPEN_API_VERSION
    },
    config.openApiObject,
    { paths }
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

export const defaultResponse: OpenAPIV3_1.ResponseObject = {
  description: DEFAULT_ERRORS.unexpectedError,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }
  }
};

export const getPathsFromMethodHandlers = ({
  methodHandlers,
  route
}: {
  methodHandlers: RouteParams | ApiRouteParams;
  route: string;
}) => {
  const { openApiPath } = methodHandlers;
  const paths: OpenAPIV3_1.PathsObject = {};

  paths[route] = {
    ...openApiPath
  };

  Object.keys(methodHandlers)
    .filter(isValidMethod)
    .forEach((_method) => {
      const methodHandler = methodHandlers[_method];

      if (!methodHandler) {
        return;
      }

      const { openApiOperation, input, output } = methodHandler._config;
      const method = _method.toLowerCase();
      const generatedOperationObject: OpenAPIV3_1.OperationObject = {};

      if (input?.body && input?.contentType) {
        const schema = getJsonSchema({ schema: input.body });

        generatedOperationObject.requestBody = {
          content: {
            [input.contentType]: {
              schema
            }
          }
        };
      }

      const generatedResponses = output?.reduce(
        (obj, { status, contentType, schema }) => {
          const responseSchema = getJsonSchema({ schema });

          return Object.assign(obj, {
            [status]: {
              content: {
                [contentType]: {
                  schema: responseSchema
                }
              }
            }
          });
        },
        {}
      );

      generatedOperationObject.responses = {
        ...generatedResponses,
        default: defaultResponse
      };

      const pathParameters = route
        .match(/{([^}]+)}/g)
        ?.map((param) => param.replace(/[{}]/g, ''));

      if (pathParameters) {
        generatedOperationObject.parameters = pathParameters.map((name) => ({
          name,
          in: 'path',
          required: true
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
            .map((key) => ({
              name: key,
              in: 'query'
            }))
        ];
      }

      paths[route] = {
        ...paths[route],
        [method]: merge(generatedOperationObject, openApiOperation)
      };
    });

  return paths;
};
