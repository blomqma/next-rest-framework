import { readdirSync, readFileSync } from 'fs';
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
  ValidMethod
} from '../constants';
import merge from 'lodash.merge';
import { getJsonSchema } from './schemas';

export const getHTMLForSwaggerUI = ({
  headers
}: {
  headers: http.IncomingHttpHeaders;
}) => {
  const proto = headers['x-forwarded-proto'] ?? 'http';
  const host = headers.host;
  const url = `${proto}://${host}/api/openapi.yaml`;

  const css = readFileSync(
    join(
      process.cwd(),
      'node_modules/next-rest-framework/dist/swagger-ui/swagger-ui.css'
    )
  );

  const swaggerUiBundle = readFileSync(
    join(
      process.cwd(),
      'node_modules/next-rest-framework/dist/swagger-ui/swagger-ui-bundle.js'
    )
  );

  const swaggerUiStandalonePreset = readFileSync(
    join(
      process.cwd(),
      'node_modules/next-rest-framework/dist/swagger-ui/swagger-ui-standalone-preset.js'
    )
  );

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="SwaggerUI"
    />
    <title>Next REST Framework | SwaggerUI</title>
    <style>${css}</style>
  </head>
  <body>
  <div id="swagger-ui"></div>
  <script>${swaggerUiBundle}</script>
  <script>${swaggerUiStandalonePreset}</script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
          url: '${url}',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: "StandaloneLayout",
      });
    };
  </script>
  </body>
  </html>`;
};

// Generate the OpenAPI paths from the Next.js API routes.
// If a single path fails to generate, the entire process will fail.
const generatePaths = async ({
  req: { headers },
  config: { openApiJsonPath, openApiYamlPath, swaggerUiPath }
}: {
  req: NextApiRequest;
  res: NextApiResponse;
  config: NextRestFrameworkConfig;
}): Promise<OpenAPIV3_1.PathsObject> => {
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

      const res = await fetch(url, {
        headers: {
          'User-Agent': NEXT_REST_FRAMEWORK_USER_AGENT
        }
      });

      const data: Record<string, OpenAPIV3_1.PathItemObject> = await res.json();

      const isPathItemObject = (
        obj: unknown
      ): obj is OpenAPIV3_1.PathItemObject => {
        return typeof obj === 'object' && !!obj && !('message' in obj);
      };

      if (res.status === 200 && isPathItemObject(data)) {
        paths = { ...paths, ...data };
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
        const schema = getJsonSchema({ schema: input.schema });

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

      paths[route] = {
        ...paths[route],
        [method]: merge(generatedOperationObject, openApiSpec)
      };
    });

  return paths;
};
