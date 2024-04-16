import chalk from 'chalk';
import { type NrfOasData } from '../shared/paths';
import { type NextRestFrameworkConfig } from '../types';
import { existsSync, readdirSync } from 'fs';
import { type OpenAPIV3_1 } from 'openapi-types';
import { join } from 'path';
import { isValidMethod } from '../shared';
import { merge } from 'lodash';
import { OPEN_API_VERSION } from './constants';

// Traverse the base path and find all nested files.
const getNestedFiles = (basePath: string, dir: string): string[] => {
  const dirents = readdirSync(join(basePath, dir), { withFileTypes: true });

  const files = dirents.map((dirent) => {
    const res = join(dir, dirent.name);
    return dirent.isDirectory() ? getNestedFiles(basePath, res) : res;
  });

  return files.flat();
};

// Convert file path of a route to a route name.
const getRouteName = (file: string) =>
  `/${file}`
    .replace('/route.ts', '')
    .replace('/route.js', '')
    .replace(/\\/g, '/')
    .replaceAll('[', '{')
    .replaceAll(']', '}');

// Convert file path of an API route to an API route name.
const getApiRouteName = (file: string) =>
  `/api/${file}`
    .replace('/index', '')
    .replace(/\\/g, '/')
    .replaceAll('[', '{')
    .replaceAll(']', '}')
    .replace('.ts', '')
    .replace('.js', '');

// Find the Next REST Framework config from one of the docs route handlers.
export const findConfig = async ({ configPath }: { configPath?: string }) => {
  const configs: Array<{
    routeName: string;
    config: Required<NextRestFrameworkConfig>;
  }> = [];

  // Scan `app` or `src/app` folders for docs route handlers.
  const findAppRouterConfig = async (path: string) => {
    const appRouterPath = join(process.cwd(), path);

    if (existsSync(appRouterPath)) {
      const filteredRoutes = getNestedFiles(appRouterPath, '').filter(
        (file) => {
          if (configPath) {
            return configPath === getRouteName(file);
          }

          return file.endsWith('route.ts') || file.endsWith('route.js');
        }
      );

      await Promise.all(
        filteredRoutes.map(async (route) => {
          try {
            const filePathToRoute = join(process.cwd(), path, route);

            const url = new URL(`file://${filePathToRoute}`).toString();
            const res = await import(url).then((mod) => mod.default);

            const handlers: any[] = Object.entries(res)
              .filter(([key]) => isValidMethod(key))
              .map(([_key, handler]) => handler);

            for (const handler of handlers) {
              const _config = handler._nextRestFrameworkConfig;

              if (_config) {
                configs.push({
                  routeName: getRouteName(route),
                  config: _config
                });
              }
            }
          } catch {
            // Route was not a docs handler.
          }
        })
      );
    }
  };

  // Scan `app` folder.
  await findAppRouterConfig('app');

  // Scan `src/app` folder.
  await findAppRouterConfig('src/app');

  // Scan `pages/api` or `src/pages/api` folders for docs API route handlers.
  const findPagesRouterConfig = async (path: string) => {
    const pagesRouterPath = join(process.cwd(), path);

    if (existsSync(pagesRouterPath)) {
      const filteredApiRoutes = getNestedFiles(pagesRouterPath, '').filter(
        (file) => {
          if (configPath) {
            return configPath === getApiRouteName(file);
          }

          return true;
        }
      );

      await Promise.all(
        filteredApiRoutes.map(async (route) => {
          try {
            const filePathToRoute = join(process.cwd(), path, route);

            const url = new URL(`file://${filePathToRoute}`).toString();
            const res = await import(url).then((mod) => mod.default);

            const _config = res.default._nextRestFrameworkConfig;

            if (_config) {
              configs.push({
                routeName: getApiRouteName(route),
                config: _config
              });
            }
          } catch {
            // API route was not a docs handler.
          }
        })
      );
    }
  };

  // Scan `pages/api` folder.
  await findPagesRouterConfig('pages/api');

  // Scan `src/pages/api` folder.
  await findPagesRouterConfig('src/pages/api');

  const { routeName, config } = configs[0] ?? { route: '', config: null };

  if (!config && configPath) {
    console.error(
      chalk.red(
        `A \`configPath\` parameter with a value of ${configPath} was provided but no Next REST Framework configs were found.`
      )
    );

    return;
  }

  if (!config) {
    console.error(
      chalk.red(
        'Next REST Framework config not found. Initialize a docs handler to generate the OpenAPI spec.'
      )
    );

    return;
  }

  if (configs.length > 1) {
    console.info(
      chalk.yellowBright(
        'Multiple Next REST Framework configs found. Please specify a `configPath` parameter to select a specific config.'
      )
    );
  }

  console.info(
    chalk.yellowBright(`Using Next REST Framework config: ${routeName}`)
  );

  return config;
};

// Generate the OpenAPI paths from the Next.js routes and API routes from the build output.
export const generatePathsFromBuild = async ({
  config
}: {
  config: Required<NextRestFrameworkConfig>;
}): Promise<NrfOasData> => {
  const ignoredPaths: string[] = [];

  // Match wildcard paths with single or multiple segments.
  const isWildcardMatch = ({
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
   * Filter routes to include:
   * - Remove any routes that are not route handlers.
   * - Remove catch-all routes.
   * - Filter RPC routes.
   * - Filter disallowed paths.
   */
  const getCleanedRoutes = (files: string[]) =>
    files.filter(
      (file) =>
        (file.endsWith('route.ts') || file.endsWith('route.js')) &&
        !file.includes('[...') &&
        !file.endsWith('rpc/[operationId]/route.ts') &&
        !file.endsWith('rpc/[operationId]/route.js') &&
        isAllowedRoute(getRouteName(file))
    );

  /*
   * Filter RPC routes to include:
   * - Remove any routes that are not RPC routes.
   * - Filter disallowed paths.
   */
  const getCleanedRpcRoutes = (files: string[]) =>
    files.filter(
      (file) =>
        (file.endsWith('rpc/[operationId]/route.ts') ||
          file.endsWith('rpc/[operationId]/route.js')) &&
        isAllowedRoute(getRouteName(file))
    );

  /*
   * Filter the API routes to include:
   * - Remove non-TS/JS files.
   * - Remove catch-all API routes.
   * - Filter RPC API routes.
   * - Filter disallowed paths.
   */
  const getCleanedApiRoutes = (files: string[]) =>
    files.filter(
      (file) =>
        (file.endsWith('.ts') || file.endsWith('.js')) &&
        !file.includes('[...') &&
        !file.endsWith('rpc/[operationId].ts') &&
        !file.endsWith('rpc/[operationId].js') &&
        isAllowedRoute(getApiRouteName(file))
    );

  /*
   * Filter RPC API routes to include:
   * - Remove any API routes that are not RPC API routes.
   * - Filter disallowed paths.
   */
  const getCleanedRpcApiRoutes = (files: string[]) =>
    files.filter(
      (file) =>
        (file.endsWith('rpc/[operationId].ts') ||
          file.endsWith('rpc/[operationId].js')) &&
        isAllowedRoute(getApiRouteName(file))
    );

  const isNrfOasData = (x: unknown): x is NrfOasData => {
    if (typeof x !== 'object' || x === null) {
      return false;
    }
    return 'paths' in x;
  };

  let paths: OpenAPIV3_1.PathsObject = {};
  let schemas: Record<string, OpenAPIV3_1.SchemaObject> = {};

  // Scan `app` or `src/app` folders for route handlers and get the OpenAPI paths.
  const collectAppRouterPaths = async (path: string) => {
    const appRouterPath = join(process.cwd(), path);

    if (existsSync(appRouterPath)) {
      const files = getNestedFiles(appRouterPath, '');
      const routes = getCleanedRoutes(files);
      const rpcRoutes = getCleanedRpcRoutes(files);

      await Promise.all(
        [...routes, ...rpcRoutes].map(async (route) => {
          try {
            const filePathToRoute = join(process.cwd(), path, route);

            const url = new URL(`file://${filePathToRoute}`).toString();
            const res = await import(url).then((mod) => mod.default);

            const handlers: any[] = Object.entries(res)
              .filter(([key]) => isValidMethod(key))
              .map(([_key, handler]) => handler);

            for (const handler of handlers) {
              const data = await handler._getPathsForRoute(getRouteName(route));

              if (isNrfOasData(data)) {
                paths = { ...paths, ...data.paths };
                schemas = { ...schemas, ...data.schemas };
              }
            }
          } catch {
            // Route was not a route handler.
          }
        })
      );
    }
  };

  // Scan `app` folder.
  await collectAppRouterPaths('app');

  // Scan `src/app` folder.
  await collectAppRouterPaths('src/app');

  // Scan `pages/api` or `src/pages/api` folders for API route handlers and get the OpenAPI paths.
  const collectPagesRouterPaths = async (path: string) => {
    const pagesRouterPath = join(process.cwd(), path);

    if (existsSync(pagesRouterPath)) {
      const files = getNestedFiles(pagesRouterPath, '');
      const apiRoutes = getCleanedApiRoutes(files);
      const rpcApiRoutes = getCleanedRpcApiRoutes(files);

      await Promise.all(
        [...apiRoutes, ...rpcApiRoutes].map(async (apiRoute) => {
          try {
            const filePathToRoute = join(process.cwd(), path, apiRoute);

            const url = new URL(`file://${filePathToRoute}`).toString();
            const res = await import(url).then((mod) => mod.default);

            const data = await res.default._getPathsForRoute(
              getApiRouteName(apiRoute)
            );

            if (isNrfOasData(data)) {
              paths = { ...paths, ...data.paths };
              schemas = { ...schemas, ...data.schemas };
            }
          } catch {
            // Route was not an API route handler.
          }
        })
      );
    }
  };

  // Scan `pages/api` folder.
  await collectPagesRouterPaths('pages/api');

  // Scan `src/pages/api` folder.
  await collectPagesRouterPaths('src/pages/api');

  if (ignoredPaths.length) {
    console.info(
      chalk.yellowBright(
        `The following paths are ignored by Next REST Framework: ${chalk.bold(
          ignoredPaths.map((p) => `\n- ${p}`)
        )}`
      )
    );
  }

  return {
    paths,
    schemas
  };
};

// Find Next REST Framework config and generate the OpenAPI spec.
export const generateOpenApiSpec = async ({
  config
}: {
  config: Required<NextRestFrameworkConfig>;
}) => {
  const { paths = {}, schemas = {} } = await generatePathsFromBuild({
    config
  });

  const sortObjectByKeys = <T extends Record<string, unknown>>(obj: T): T => {
    const unordered = { ...obj };

    return Object.keys(unordered)
      .sort()
      .reduce<Record<string, unknown>>((_obj, key) => {
        _obj[key] = unordered[key];
        return _obj;
      }, {}) as T;
  };

  const components = Object.keys(schemas).length
    ? { components: { schemas: sortObjectByKeys(schemas) } }
    : {};

  const spec: OpenAPIV3_1.Document = merge(
    {
      openapi: OPEN_API_VERSION,
      info: config.openApiObject.info,
      paths: sortObjectByKeys(paths)
    },
    components,
    config.openApiObject as OpenAPIV3_1.Document
  );

  return spec;
};
