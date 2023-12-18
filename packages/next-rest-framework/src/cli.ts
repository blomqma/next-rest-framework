#!/usr/bin/env node

import { Command } from 'commander';
import { spawn } from 'child_process';
import waitOn from 'wait-on';
import { join } from 'path';
import chalk from 'chalk';
import { type NextRestFrameworkConfig } from './types';
import { type OpenAPIV3_1 } from 'openapi-types';
import {
  type NrfOasData,
  getApiRouteName,
  getNestedFiles,
  getRouteName,
  isValidMethod,
  isWildcardMatch,
  logIgnoredPaths,
  syncOpenApiSpec
} from './shared';
import { existsSync, readFileSync } from 'fs';
import { isEqualWith, merge } from 'lodash';
import { OPEN_API_VERSION } from './constants';

// Generate the OpenAPI paths from the Next.js routes and API routes from the build output.
const generatePathsFromBuild = async ({
  config,
  distDir
}: {
  config: Required<NextRestFrameworkConfig>;
  distDir: string;
}): Promise<NrfOasData> => {
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
   * - Replace back slashes, square brackets etc.
   * - Filter disallowed routes.
   */
  const getCleanedRoutes = (files: string[]) =>
    files
      .filter((file) => file.endsWith('route.js'))
      .filter((file) => !file.includes('[...'))
      .filter((file) => isAllowedRoute(getRouteName(file)));

  const getCleanedRpcRoutes = (files: string[]) =>
    files.filter((file) => file.endsWith('rpc/[operationId]/route.ts'));

  /*
   * Clean and filter the API routes to paths:
   * - Remove catch-all routes.
   * - Add the `/api` prefix.
   * - Replace back slashes, square brackets etc.
   * - Filter disallowed routes.
   */
  const getCleanedApiRoutes = (files: string[]) =>
    files
      .filter((file) => !file.includes('[...'))
      .filter((file) => isAllowedRoute(getApiRouteName(file)));

  const getCleanedRpcApiRoutes = (files: string[]) =>
    files.filter((file) => file.endsWith('rpc/[operationId].ts'));

  const isNrfOasData = (x: unknown): x is NrfOasData => {
    if (typeof x !== 'object' || x === null) {
      return false;
    }
    return 'paths' in x;
  };

  let paths: OpenAPIV3_1.PathsObject = {};
  let schemas: Record<string, OpenAPIV3_1.SchemaObject> = {};

  try {
    // Scan `app` folder.
    const path = join(process.cwd(), distDir, 'server/app');

    if (existsSync(path)) {
      const files = getNestedFiles(path, '');
      const routes = getCleanedRoutes(files);
      const rpcRoutes = getCleanedRpcRoutes(files);

      await Promise.all(
        [...routes, ...rpcRoutes].map(async (route) => {
          const res = await import(
            join(process.cwd(), distDir, 'server/app', route)
          );

          Object.entries(res.routeModule.userland)
            .filter(([key]) => isValidMethod(key))
            .forEach(([_key, handler]: [string, any]) => {
              const data = handler._getPaths(getRouteName(route));

              if (isNrfOasData(data)) {
                paths = { ...paths, ...data.paths };
                schemas = { ...schemas, ...data.schemas };
              }
            });
        })
      );
    }
  } catch {
    // Route was not a route handler.
  }

  try {
    // Scan `pages/api` folder.
    const path = join(process.cwd(), distDir, 'server/pages/api');

    if (existsSync(path)) {
      const files = getNestedFiles(path, '');
      const apiRoutes = getCleanedApiRoutes(files);
      const rpcApiRoutes = getCleanedRpcApiRoutes(files);

      await Promise.all(
        [...apiRoutes, ...rpcApiRoutes].map(async (apiRoute) => {
          const res = await import(
            join(process.cwd(), distDir, 'server/pages/api', apiRoute)
          );

          const data = res.default._getPaths(getApiRouteName(apiRoute));

          if (isNrfOasData(data)) {
            paths = { ...paths, ...data.paths };
            schemas = { ...schemas, ...data.schemas };
          }
        })
      );
    }
  } catch {
    // Route was not an API route handler.
  }

  if (ignoredPaths.length) {
    logIgnoredPaths(ignoredPaths);
  }

  return {
    paths,
    schemas
  };
};

const findConfig = async ({
  distDir,
  configPath
}: {
  distDir: string;
  configPath?: string;
}) => {
  let config: Required<NextRestFrameworkConfig> | undefined;

  try {
    // Scan `app` folder.
    const path = join(process.cwd(), distDir, 'server/app');

    if (existsSync(path)) {
      const filteredRoutes = getNestedFiles(path, '').filter((file) => {
        if (configPath) {
          return configPath === getRouteName(file);
        }

        return true;
      });

      await Promise.all(
        filteredRoutes.map(async (file) => {
          const res = await import(
            join(process.cwd(), distDir, 'server/app', file)
          );

          Object.entries(res.routeModule.userland)
            .filter(([key]) => isValidMethod(key))
            .forEach(([_key, handler]: [string, any]) => {
              const _config = handler._nextRestFrameworkConfig;

              if (_config) {
                config = _config;
              }
            });
        })
      );
    }
  } catch {
    // Route was not a docs handler.
  }

  // Config found, no need to do a further scan.
  if (config) {
    return config;
  }

  try {
    // Scan `pages/api` folder.
    const path = join(process.cwd(), distDir, 'server/pages/api');

    if (existsSync(path)) {
      const filteredApiRoutes = getNestedFiles(path, '').filter((file) => {
        if (configPath) {
          return configPath === getApiRouteName(file);
        }

        return true;
      });

      await Promise.all(
        filteredApiRoutes.map(async (file) => {
          const res = await import(
            join(process.cwd(), distDir, 'server/pages/api', file)
          );

          const _config = res.default._nextRestFrameworkConfig;

          if (_config) {
            config = _config;
          }
        })
      );
    }
  } catch {
    // API Route was not a docs handler.
  }

  return config;
};

// Sync the `openapi.json` file from generated paths from the build output.
const syncOpenApiSpecFromBuild = async ({
  distDir,
  configPath
}: {
  distDir: string;
  configPath?: string;
}) => {
  const config = await findConfig({ distDir, configPath });

  if (!config && configPath) {
    console.log(
      chalk.red(
        `A \`configPath\` parameter with a value of ${configPath} was provided but no Next REST Framework configs were found.`
      )
    );

    return;
  }

  if (!config) {
    console.log(
      chalk.red(
        'Next REST Framework config not found. Initialize a docs handler to generate the OpenAPI spec.'
      )
    );

    return;
  }

  console.log(chalk.yellowBright('Next REST Framework config found!'));
  const nrfOasData = await generatePathsFromBuild({ config, distDir });
  await syncOpenApiSpec({ config, nrfOasData });
};

const sortObjectByKeys = <T extends Record<string, unknown>>(obj: T): T => {
  const unordered = { ...obj };

  return Object.keys(unordered)
    .sort()
    .reduce<Record<string, unknown>>((_obj, key) => {
      _obj[key] = unordered[key];
      return _obj;
    }, {}) as T;
};

// Sync the `openapi.json` file from generated paths from the build output.
const validateOpenApiSpecFromBuild = async ({
  distDir,
  configPath
}: {
  distDir: string;
  configPath?: string;
}) => {
  const config = await findConfig({ distDir, configPath });

  if (!config && configPath) {
    console.log(
      chalk.red(
        `A \`configPath\` parameter with a value of ${configPath} was provided but no Next REST Framework configs were found.`
      )
    );

    return;
  }

  if (!config) {
    console.log(
      chalk.red(
        'Next REST Framework config not found. Initialize a docs handler to validate the OpenAPI spec.'
      )
    );

    return;
  }

  console.log(chalk.yellowBright('Next REST Framework config found!'));

  const { paths = {}, schemas = {} } = await generatePathsFromBuild({
    config,
    distDir
  });

  const path = join(process.cwd(), 'public', config.openApiJsonPath);

  const components = Object.keys(schemas).length
    ? { components: { schemas: sortObjectByKeys(schemas) } }
    : {};

  const newSpec: OpenAPIV3_1.Document = merge(
    {
      openapi: OPEN_API_VERSION,
      paths: sortObjectByKeys(paths)
    },
    components,
    config.openApiObject as OpenAPIV3_1.Document
  );

  try {
    const data = readFileSync(path);
    const openApiSpec = JSON.parse(data.toString());

    if (!isEqualWith(openApiSpec, newSpec)) {
      console.error(
        chalk.red(
          'API spec changed is not up-to-date. Run `next-rest-framework generate` to update it.'
        )
      );
    } else {
      console.info(chalk.green('OpenAPI spec up to date!'));
      return true;
    }
  } catch {
    console.error(
      chalk.red(
        'No OpenAPI spec found. Run `next-rest-framework generate` to generate it.'
      )
    );
  }

  return false;
};

const program = new Command();

program
  .command('generate')
  .option(
    '--skipBuild <boolean>',
    'By default, `next build` is used to build your routes. If you have already created the build, you can skip this step by setting this to `true`.'
  )
  .option(
    '--distDir <string>',
    'Path to your production build directory. Defaults to `.next`.'
  )
  .option(
    '--timeout <string>',
    'The timeout for generating the OpenAPI spec. Defaults to 60 seconds.'
  )
  .option(
    '--configPath <string>',
    'In case you have multiple docs handlers with different configurations, you can specify which configuration you want to use by providing the path to the API. Example: `/api/my-configuration`.'
  )
  .option(
    '--debug <boolean>',
    'Inherit and display logs from the `next build` command. Defaults to `false`.'
  )
  .description('Generate an OpenAPI spec with Next REST Framework.')
  .action(async (options) => {
    const skipBuild: boolean = options.skipBuild ?? false;
    const distDir: string = options.distDir ?? '.next';
    const timeout: number = options.timeout ?? 60000;
    const configPath: string = options.configPath ?? '';
    const debug: boolean = options.debug ?? false;

    console.log(chalk.yellowBright('Generating OpenAPI spec...'));

    if (!skipBuild) {
      const server = spawn('npx', ['next', 'build'], {
        stdio: debug ? 'inherit' : 'ignore'
      });

      try {
        await waitOn({
          resources: [join(process.cwd(), distDir, 'BUILD_ID')],
          timeout
        });

        server.kill();

        await syncOpenApiSpecFromBuild({
          distDir,
          configPath
        });
      } catch (e) {
        console.error(e);
        server.kill();
        process.exit(1);
      }
    } else {
      try {
        await syncOpenApiSpecFromBuild({
          distDir,
          configPath
        });
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }
  });

program
  .command('validate')
  .option(
    '--skipBuild <boolean>',
    'By default, `next build` is used to build your routes. If you have already created the build, you can skip this step by setting this to `true`.'
  )
  .option(
    '--distDir <string>',
    'Path to your production build directory. Defaults to `.next`.'
  )
  .option(
    '--timeout <string>',
    'The timeout for generating the OpenAPI spec. Defaults to 60 seconds.'
  )
  .option(
    '--configPath <string>',
    'In case you have multiple docs handlers with different configurations, you can specify which configuration you want to use by providing the path to the API. Example: `/api/my-configuration`.'
  )
  .option(
    '--debug <boolean>',
    'Inherit and display logs from the `next build` command. Defaults to `false`.'
  )
  .description('Validate an OpenAPI spec with Next REST Framework.')
  .action(async (options) => {
    const skipBuild: boolean = options.skipBuild ?? false;
    const distDir: string = options.distDir ?? '.next';
    const timeout: number = options.timeout ?? 60000;
    const configPath: string = options.configPath ?? '';
    const debug: boolean = options.debug ?? false;

    console.log(chalk.yellowBright('Validating OpenAPI spec...'));

    if (!skipBuild) {
      const server = spawn('npx', ['next', 'build'], {
        stdio: debug ? 'inherit' : 'ignore'
      });

      try {
        await waitOn({
          resources: [join(process.cwd(), distDir, 'BUILD_ID')],
          timeout
        });

        server.kill();

        const valid = await validateOpenApiSpecFromBuild({
          distDir,
          configPath
        });

        if (!valid) {
          process.exit(1);
        }
      } catch (e) {
        console.error(e);
        server.kill();
        process.exit(1);
      }
    } else {
      try {
        const valid = await validateOpenApiSpecFromBuild({
          distDir,
          configPath
        });

        if (!valid) {
          process.exit(1);
        }
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }
  });

program.parse(process.argv);
