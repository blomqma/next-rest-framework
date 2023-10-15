import { join } from 'path';
import {
  type MethodHandler,
  type NextRestFrameworkConfig,
  type DefineApiRouteParams,
  type DefineRouteParams
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

// Traverse the base path and find all nested files.
const getNestedRoutes = (basePath: string, dir: string): string[] => {
  const dirents = readdirSync(join(basePath, dir), { withFileTypes: true });

  const files = dirents.map((dirent) => {
    const res = join(dir, dirent.name);
    return dirent.isDirectory() ? getNestedRoutes(basePath, res) : res;
  });

  return files.flat();
};

// Generate the OpenAPI paths from the Next.js routes and API routes.
const generatePaths = async ({
  config,
  baseUrl,
  url
}: {
  config: NextRestFrameworkConfig;
  baseUrl: string;
  url: string;
}): Promise<OpenAPIV3_1.PathsObject> => {
  // Match wildcard paths with single or multiple segments.
  const isWildcardMatch = (pattern: string, path: string) => {
    const regexPattern = pattern
      .split('/')
      .map((segment) =>
        segment === '*' ? '[^/]*' : segment === '**' ? '.*' : segment
      )
      .join('/');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  };

  const ignoredPaths: string[] = [];

  // Check if the route is allowed or denied by the user.
  const isAllowedRoute = (path: string) => {
    const isAllowed = config.allowedPaths?.some((allowedPath) =>
      isWildcardMatch(allowedPath, path)
    );

    const isDenied = config.deniedPaths?.some((deniedPath) =>
      isWildcardMatch(deniedPath, path)
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
      .map((file) =>
        `/${file}`
          .replace('/route.ts', '')
          .replace(/\\/g, '/')
          .replace('[', '{')
          .replace(']', '}')
      )
      .filter(isAllowedRoute);

  let _routes: string[] = [];

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
      .map((file) =>
        `/api/${file}`
          .replace('/index', '')
          .replace(/\\/g, '/')
          .replace('[', '{')
          .replace(']', '}')
          .replace('.ts', '')
      )
      .filter((route) => route !== `/${url.split('/').at(-1)}`)
      .filter(isAllowedRoute);

  try {
    // Scan `app` folder.
    const path = join(process.cwd(), 'app');

    if (existsSync(path)) {
      _routes = getCleanedRoutes(getNestedRoutes(path, ''));
    } else {
      // Scan `src/app` folder.
      const path = join(process.cwd(), 'src/app');

      if (existsSync(path)) {
        _routes = getCleanedRoutes(getNestedRoutes(path, ''));
      }
    }
  } catch {}

  let apiRoutes: string[] = [];

  try {
    // Scan `pages/api` folder.
    const path = join(process.cwd(), 'pages/api');

    if (existsSync(path)) {
      apiRoutes = getCleanedApiRoutes(getNestedRoutes(path, ''));
    } else {
      // Scan `src/pages/api` folder.
      const path = join(process.cwd(), 'src/pages/api');

      if (existsSync(path)) {
        apiRoutes = getCleanedApiRoutes(getNestedRoutes(path, ''));
      }
    }
  } catch {}

  if (
    !config.suppressInfo &&
    ignoredPaths.length &&
    !global.ignoredPathsLogged
  ) {
    console.info(
      chalk.yellowBright(
        `The following paths are ignored by Next REST Framework: ${chalk.bold(
          ignoredPaths.map((p) => `\n- ${p}`)
        )}`
      )
    );

    global.ignoredPathsLogged = true;
  }

  const routes = [..._routes, ...apiRoutes];

  let paths: OpenAPIV3_1.PathsObject = {};

  // Call the API routes to get the OpenAPI paths.
  await Promise.all(
    routes.map(async (route) => {
      const url = `${baseUrl}${route}`;
      const controller = new AbortController();

      const abortRequest = setTimeout(() => {
        controller.abort();
      }, config.generatePathsTimeout);

      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': NEXT_REST_FRAMEWORK_USER_AGENT,
            'Content-Type': 'application/json',
            'x-forwarded-proto': baseUrl.split('://')[0],
            'x-forwarded-host': baseUrl.split('://')[1]
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

  const sortedPathKeys = Object.keys(paths).sort();
  const sortedPaths: typeof paths = {};

  for (const key of sortedPathKeys) {
    sortedPaths[key] = paths[key];
  }

  return sortedPaths;
};

// In prod use the existing openapi.json file - in development mode update it whenever the generated API spec changes.
export const syncOpenApiSpec = async ({
  config,
  baseUrl,
  url
}: {
  config: NextRestFrameworkConfig;
  baseUrl: string;
  url: string;
}) => {
  let specFileFound = false;

  try {
    const data = readFileSync(
      join(process.cwd(), 'public', config.openApiJsonPath ?? '')
    );

    global.openApiSpec = JSON.parse(data.toString());
    specFileFound = true;
  } catch {}

  if (process.env.NODE_ENV !== 'production') {
    const paths = await generatePaths({ config, baseUrl, url });

    const newSpec = merge(
      {
        openapi: OPEN_API_VERSION,
        info: {
          'x-logo': {
            url: config.docsConfig?.logoUrl
          }
        }
      },
      config.openApiSpecOverrides,
      { paths }
    );

    if (!isEqualWith(global.openApiSpec, newSpec)) {
      if (!specFileFound) {
        console.info(
          chalk.yellowBright('No API spec found, generating openapi.json')
        );
      } else {
        console.info(
          chalk.yellowBright('API spec changed, regenerating openapi.json')
        );
      }

      const publicPath = join(process.cwd(), 'public');

      if (!existsSync(publicPath)) {
        console.info(
          chalk.redBright(
            `The \`public\` folder was not found. Generating OpenAPI spec aborted.`
          )
        );

        return;
      }

      const path = join(process.cwd(), 'public', config.openApiJsonPath ?? '');
      const jsonSpec = JSON.stringify(newSpec, null, 2) + '\n';
      writeFileSync(path, jsonSpec, null);

      if (!global.apiSpecGeneratedLogged) {
        console.info(chalk.green('API spec generated successfully!'));
      }

      global.openApiSpec = newSpec;
    } else if (!global.apiSpecGeneratedLogged) {
      console.info(chalk.green('API spec up to date, skipping generation.'));
    }

    global.apiSpecGeneratedLogged = true;
  }
};

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

export const isValidMethod = (x: unknown): x is ValidMethod =>
  Object.values(ValidMethod).includes(x as ValidMethod);

export const getPathsFromMethodHandlers = ({
  methodHandlers,
  route
}: {
  methodHandlers: DefineRouteParams | DefineApiRouteParams;
  route: string;
}) => {
  const { openApiSpecOverrides } = methodHandlers;
  const paths: OpenAPIV3_1.PathsObject = {};

  paths[route] = {
    ...openApiSpecOverrides
  };

  Object.keys(methodHandlers)
    .filter(isValidMethod)
    .forEach((_method) => {
      const { openApiSpecOverrides, tags, input, output } = methodHandlers[
        _method
      ] as MethodHandler;

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

      if (tags) {
        generatedOperationObject.tags = tags;
      }

      const pathParameters = route.match(/{([^}]+)}/g);

      if (pathParameters) {
        generatedOperationObject.parameters = pathParameters.map((param) => ({
          name: param.replace(/[{}]/g, ''),
          in: 'path',
          required: true
        }));
      }

      if (input?.query) {
        generatedOperationObject.parameters = [
          ...(generatedOperationObject.parameters ?? []),
          ...getSchemaKeys({
            schema: input.query
          }).map((key) => ({
            name: key,
            in: 'query'
          }))
        ];
      }

      paths[route] = {
        ...paths[route],
        [method]: merge(generatedOperationObject, openApiSpecOverrides)
      };
    });

  return paths;
};
