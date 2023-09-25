import { type OpenAPIV3_1 } from 'openapi-types';
import { type Modify } from './utility-types';
import { type ErrorHandler } from './error-handler';

type NextRestFrameworkOpenApiSpec = Partial<
  Modify<
    Omit<OpenAPIV3_1.Document, 'openapi'>,
    {
      info: Partial<OpenAPIV3_1.InfoObject>;
    }
  >
>;

export interface NextRestFrameworkConfig {
  // Absolute path to the app directory where your routes are located, usually either `app` or `src/app`.
  appDirPath?: string;
  // Absolute path to the directory where your API routes are located, usually `pages/api` or `src/pages/api`.
  apiRoutesPath?: string;
  openApiSpecOverrides?: NextRestFrameworkOpenApiSpec; // Fully typed OpenAPI spec for your API.
  openApiJsonPath?: string; // Path that will be used for the OpenAPI spec - defaults tp `/api/openapi.json`.
  openApiYamlPath?: string; // Path that will be used for the OpenAPI spec - defaults tp `/api/openapi.json`.
  swaggerUiPath?: string; // Path that will be used for the API docs - defaults to `/api/docs`.
  // Customization options for Swagger UI.
  swaggerUiConfig?: {
    defaultTheme?: 'light' | 'dark'; // Default theme to use for SwaggerUI - defaults to "light".
    title?: string;
    description?: string;
    faviconHref?: string;
    logoHref?: string;
  };
  exposeOpenApiSpec?: boolean; // Setting this to `false` will expose neither the API docs nor the OpenAPI specs.
  errorHandler?: ErrorHandler; // A function that will be called when an error occurs. By default, it will return a 500 status code and a default error unless your provide a custom response.
  suppressInfo?: boolean; // Setting this to `true` will suppress all informational logs from Next REST Framework.
  generatePathsTimeout?: number; // Timeout in milliseconds for generating the OpenAPI spec. Defaults to 5000. For large applications you might have to increase this.
}
