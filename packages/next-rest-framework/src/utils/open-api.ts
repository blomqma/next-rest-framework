import { join } from 'path';
import http from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  DefineEndpointsParams,
  MethodHandler,
  NextRestFrameworkConfig
} from '../types';
import { OpenAPIV3_1 } from 'openapi-types';
import {
  DEFAULT_ERRORS,
  NEXT_REST_FRAMEWORK_USER_AGENT,
  OPEN_API_VERSION,
  ValidMethod,
  VERSION
} from '../constants';
import merge from 'lodash.merge';
import { getJsonSchema, getSchemaKeys } from './schemas';
import { readdirSync } from 'fs';

export const getHTMLForSwaggerUI = ({
  headers,
  config: { openApiJsonPath, openApiYamlPath, swaggerUiPath }
}: {
  headers: http.IncomingHttpHeaders;
  config: NextRestFrameworkConfig;
}) => {
  const proto = headers['x-forwarded-proto'] ?? 'http';
  const host = headers.host;
  const url = `${proto}://${host}/api/openapi.yaml`;

  return `<!DOCTYPE html>
  <html lang="en" data-theme="light">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="description"
        content="SwaggerUI"
      />
      <title>Next REST Framework | SwaggerUI</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
      <link
        href="https://cdn.jsdelivr.net/npm/daisyui@2.46.0/dist/full.css"
        rel="stylesheet"
        type="text/css"
      />
      <script src="https://cdn.tailwindcss.com"></script>
    </head>

    <body class="min-h-screen flex flex-col items-center">
      <div class="navbar bg-base-200 flex justify-center px-5">
        <div class="max-w-7xl flex justify-between grow gap-5 h-24">
          <a>
            <img
              src="https://raw.githubusercontent.com/blomqma/next-rest-framework/d02224b38d07ede85257b22ed50159a947681f99/packages/next-rest-framework/logo.svg"
              alt="Next REST Framework logo"
              class="w-32"
            />
          </a>
          <p>v${VERSION}</p>
        </div>
      </div>

      <main class="max-w-7xl grow w-full">
        <div id="swagger-ui"></div>
      </main>

      <footer class="footer bg-base-200 p-5 flex justify-center">
        <div class="container max-w-5xl flex flex-col items-center text-md gap-5">
          <ul class="flex flex-col items-center">
            <li>
              <a
                class="link"
                href="https://next-rest-framework.vercel.app/"
                target="_blank"
              >
                Docs
              </a>
            </li>
            <li>
              <a
                class="link"
                href="https://github.com/blomqma/next-rest-framework"
                target="_blank"
              >
                GitHub
              </a>
            </li>
            <li>
              <a class="link" href="${openApiJsonPath}">OpenAPI JSON</a>
            </li>
            <li>
              <a class="link" href="${openApiYamlPath}">OpenAPI YAML</a>
            </li>
            <li>
              <a class="link" href="${swaggerUiPath}">Swagger UI</a>
            </li>
          </ul>
          <p class="text-center">
            Next REST Framework © ${new Date().getFullYear()}
          </p>
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

const getNestedApiRoutes = (basePath: string, dir: string): string[] => {
  const dirents = readdirSync(join(basePath, dir), { withFileTypes: true });

  const files = dirents.map((dirent) => {
    const res = join(dir, dirent.name);
    return dirent.isDirectory() ? getNestedApiRoutes(basePath, res) : res;
  });

  return files.flat();
};

// Generate the OpenAPI paths from the Next.js API routes.
// If a single path fails to generate, the entire process will fail.
const generatePaths = async ({
  req: { headers },
  config: { openApiJsonPath, openApiYamlPath, swaggerUiPath, apiRoutesPath }
}: {
  req: NextApiRequest;
  res: NextApiResponse;
  config: NextRestFrameworkConfig;
}): Promise<OpenAPIV3_1.PathsObject> => {
  const filterApiRoutes = (file: string) => {
    const isCatchAllRoute = file.includes('...');

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

  const basePath = join(process.cwd(), apiRoutesPath ?? '');

  const mapApiRoutes = getNestedApiRoutes(basePath, '')
    .filter(filterApiRoutes)
    .map((file) =>
      `/api/${file}`
        .replace('/index', '')
        .replace('[', '{')
        .replace(']', '}')
        .replace('.ts', '')
    );

  let paths: OpenAPIV3_1.PathsObject = {};

  await Promise.all(
    mapApiRoutes.map(async (route) => {
      const proto = headers['x-forwarded-proto'] ?? 'http';
      const host = headers.host;
      const url = `${proto}://${host}${route}`;
      const controller = new AbortController();

      // Abort the request if it takes longer than 200ms.
      const abortRequest = setTimeout(() => {
        controller.abort();
      }, 200);

      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': NEXT_REST_FRAMEWORK_USER_AGENT
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

  return paths;
};

export const getOpenApiSpecWithPaths = async ({
  req,
  res,
  config
}: {
  req: NextApiRequest;
  res: NextApiResponse;
  config: NextRestFrameworkConfig;
}) => {
  const paths = await generatePaths({ req, res, config });

  const spec = {
    ...config.openApiSpec,
    openapi: OPEN_API_VERSION,
    paths: merge(config.openApiSpec?.paths, paths)
  };

  return spec;
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
  methodHandlers: DefineEndpointsParams;
  route: string;
}) => {
  const { openApiSpec } = methodHandlers;
  const paths: OpenAPIV3_1.PathsObject = {};

  paths[route] = {
    ...openApiSpec
  };

  Object.keys(methodHandlers)
    .filter(isValidMethod)
    .forEach((_method) => {
      const { openApiSpec, input, output } = methodHandlers[
        _method
      ] as MethodHandler;

      const method = _method.toLowerCase();

      let requestBodyContent: Record<string, OpenAPIV3_1.MediaTypeObject> = {};

      if (input) {
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

      if (input?.query) {
        generatedOperationObject.parameters = getSchemaKeys({
          schema: input.query
        }).map((key) => ({
          name: key,
          in: 'query'
        }));
      }

      paths[route] = {
        ...paths[route],
        [method]: merge(generatedOperationObject, openApiSpec)
      };
    });

  return paths;
};
