import { join } from 'path';
import { type MethodHandler, type NextRestFrameworkConfig } from '../types';
import { type OpenAPIV3_1 } from 'openapi-types';
import {
  DEFAULT_ERRORS,
  NEXT_REST_FRAMEWORK_USER_AGENT,
  OPEN_API_VERSION,
  VERSION,
  ValidMethod
} from '../constants';
import { merge, isEqualWith } from 'lodash';
import { getJsonSchema, getSchemaKeys } from './schemas';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import { type DefineRouteParams } from '../types/define-route';

export const getHTMLForSwaggerUI = ({
  config: {
    openApiJsonPath,
    swaggerUiConfig: {
      defaultTheme,
      title,
      description,
      faviconHref,
      logoHref
    } = {}
  },
  baseUrl,
  theme = defaultTheme ?? 'light'
}: {
  config: NextRestFrameworkConfig;
  baseUrl: string;
  theme?: string;
}) => {
  const url = `${baseUrl}${openApiJsonPath}`;

  return `<!DOCTYPE html>
  <html lang="en" data-theme="${theme}">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <meta
        name="description"
        content="${description}"
      />
      <link rel="icon" type="image/x-icon" href="${faviconHref}">
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
      <link
        href="https://cdn.jsdelivr.net/npm/daisyui@2.46.0/dist/full.css"
        rel="stylesheet"
        type="text/css"
      />
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        p, :not(code, a) > span:not(.opblock-summary-method), i, h1, h2, h3, h4, h5, h6, th, td, button, div {color: hsl(var(--bc)) !important;}
        svg {fill: hsl(var(--bc)) !important;}
        .opblock-section-header {background-color: hsl(var(--b)) !important;}
      </style>
    </head>

    <body class="min-h-screen flex flex-col items-center">
      <div class="navbar bg-base-200 flex justify-center">
        <div class="max-w-7xl flex justify-between grow gap-5 h-24 px-5">
          <div class="flex items-center gap-4">
            <a>
              <img
                src="${logoHref}"
                alt="Logo"
                class="w-32"
              />
            </a>
            <p>v${VERSION}</p>
          </div>
          <label class="swap swap-rotate">
            <input
              type="checkbox"
              onclick="if(this.checked){document.documentElement.setAttribute('data-theme', 'light');document.cookie='theme=light; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';}else{document.documentElement.setAttribute('data-theme', 'dark');document.cookie='theme=dark; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';}"
              ${theme === 'light' ? 'checked' : ''}
            />
            <svg
              class="swap-on fill-current w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>
            <svg
              class="swap-off fill-current w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
        </div>
      </div>

      <main class="max-w-7xl grow w-full">
        <div id="swagger-ui"></div>
      </main>

      <footer class="footer bg-base-200 flex justify-center">
        <div class="container max-w-5xl flex flex-col items-center text-md gap-5 px-5 py-2">
          <a href="https://github.com/blomqma/next-rest-framework" class="text-center text-sm flex flex-wrap items-center gap-1">
            Built with Next REST Framework
            <img
              src="https://next-rest-framework.vercel.app/img/logo.svg"
              alt="Next REST Framework logo"
              class="w-10"
            />
          </a>
        </div>
      </footer>

      <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" crossorigin></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
              url: '${url}',
              dom_id: '#swagger-ui',
          });
        };
      </script>
    </body>
  </html>`;
};

const getNestedRoutes = (basePath: string, dir: string): string[] => {
  const dirents = readdirSync(join(basePath, dir), { withFileTypes: true });

  const files = dirents.map((dirent) => {
    const res = join(dir, dirent.name);
    return dirent.isDirectory() ? getNestedRoutes(basePath, res) : res;
  });

  return files.flat();
};

// Generate the OpenAPI paths from the Next.js API routes.
const generatePaths = async ({
  config: { openApiJsonPath, openApiYamlPath, swaggerUiPath, ...config },
  baseUrl
}: {
  config: NextRestFrameworkConfig;
  baseUrl: string;
}): Promise<OpenAPIV3_1.PathsObject> => {
  const filterRoutes = (file: string) => {
    const isRoute = file.endsWith('route.ts');

    const isCatchAllRoute = file.includes('[...');

    const isOpenApiJsonRoute =
      file === `${openApiJsonPath?.split('/').at(-1)}/route.ts`;

    const isOpenApiYamlRoute =
      file === `${openApiYamlPath?.split('/').at(-1)}/route.ts`;

    const isSwaggerUiRoute =
      file === `${swaggerUiPath?.split('/').at(-1)}/route.ts`;

    if (
      !isRoute ||
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

  const filterApiRoutes = (file: string) => {
    const isCatchAllRoute = file.includes('[...');

    const isOpenApiJsonRoute =
      file === `${openApiJsonPath?.split('/').at(-1)}.ts`;

    const isOpenApiYamlRoute =
      file === `${openApiYamlPath?.split('/').at(-1)}.ts`;

    const isSwaggerUiRoute = file === `${swaggerUiPath?.split('/').at(-1)}.ts`;

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

  const appDirPath = 'appDirPath' in config ? config.appDirPath : '';

  let _routes: string[] = [];

  try {
    _routes = appDirPath
      ? getNestedRoutes(join(process.cwd(), appDirPath ?? ''), '')
          .filter(filterRoutes)
          .map((file) =>
            `${appDirPath.split('/app')[1]}/${file}`
              .replace('/route.ts', '')
              .replace(/\\/g, '/')
              .replace('[', '{')
              .replace(']', '}')
          )
      : [];
  } catch {
    // No app directory found.
  }

  const apiRoutesPath = 'apiRoutesPath' in config ? config.apiRoutesPath : '';

  let apiRoutes: string[] = [];

  try {
    apiRoutes = apiRoutesPath
      ? getNestedRoutes(join(process.cwd(), apiRoutesPath ?? ''), '')
          .filter(filterApiRoutes)
          .map((file) =>
            `/api/${file}`
              .replace('/index', '')
              .replace(/\\/g, '/')
              .replace('[', '{')
              .replace(']', '}')
              .replace('.ts', '')
          )
      : [];
  } catch {
    // No API routes directory found.
  }

  const routes = [..._routes, ...apiRoutes];

  let paths: OpenAPIV3_1.PathsObject = {};

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
export const getOrCreateOpenApiSpec = async ({
  config,
  baseUrl
}: {
  config: NextRestFrameworkConfig;
  baseUrl: string;
}) => {
  let specFileFound = false;

  try {
    const data = readFileSync(join(process.cwd(), 'openapi.json'));
    global.openApiSpec = JSON.parse(data.toString());
    specFileFound = true;
  } catch {}

  if (process.env.NODE_ENV !== 'production') {
    const paths = await generatePaths({ config, baseUrl });

    const newSpec = {
      ...config.openApiSpecOverrides,
      openapi: OPEN_API_VERSION,
      paths: merge({}, config.openApiSpecOverrides?.paths, paths)
    };

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

      writeFileSync(
        join(process.cwd(), 'openapi.json'),
        JSON.stringify(newSpec, null, 2) + '\n',
        null
      );

      if (!global.apiSpecGeneratedLogged) {
        console.info(chalk.green('API spec generated successfully!'));
      }

      global.openApiSpec = newSpec;
    } else if (!global.apiSpecGeneratedLogged) {
      console.info(chalk.green('API spec up to date, skipping generation.'));
    }

    global.apiSpecGeneratedLogged = true;
  }

  return global.openApiSpec;
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
  config,
  methodHandlers,
  route
}: {
  config: NextRestFrameworkConfig;
  methodHandlers: DefineRouteParams;
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
      let requestBodyContent: Record<string, OpenAPIV3_1.MediaTypeObject> = {};

      if (input?.body && input?.contentType) {
        const schema = getJsonSchema({ schema: input.body });

        requestBodyContent = {
          [input.contentType]: {
            schema
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

      const generatedOperationObject: OpenAPIV3_1.OperationObject = {
        requestBody: {
          content: requestBodyContent
        },
        responses: {
          ...generatedResponses,
          default: defaultResponse
        }
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
