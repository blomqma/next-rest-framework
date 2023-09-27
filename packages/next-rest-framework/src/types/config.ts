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
  /*!
   * Absolute path from the project root to the root directory where your Routes are located when using App Router.
   * Next REST Framework uses this as the root directory to recursively search for your Routes, so being as specific
   * as possible will improve performance. This option is not required when using Pages Router, but it can be used
   * together with the `apiRoutesPath` option when using both routers at the same time.
   */
  appDirPath?: 'app' | `app/${string}` | 'src/app' | `src/app/${string}`;
  /*!
   * Absolute path from the project root to the root directory where your API Routes are located when using Pages Router.
   * Next REST Framework uses this as the root directory to recursively search for your API Routes, so being as specific
   * as possible will improve performance. This option is not required when using App Router, but it can be used
   * together with the `appDirPath` option when using both routers at the same time.
   */
  apiRoutesPath?:
    | 'pages/api'
    | `pages/api/${string}`
    | 'src/pages/api'
    | `src/pages/api/${string}`;
  /*!
   * Array of paths that are denied by Next REST Framework and not included in the OpenAPI spec.
   * Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching.
   * Example: `['/api/disallowed-path', '/api/disallowed-path-2/*', '/api/disallowed-path-3/**']`
   * Defaults to no paths being disallowed.
   */
  deniedPaths?: string[];
  /*!
   * Array of paths that are allowed by Next REST Framework and included in the OpenAPI spec.
   * Supports wildcards using asterisk `*` and double asterisk `**` for recursive matching.
   * Example: `['/api/allowed-path', '/api/allowed-path-2/*', '/api/allowed-path-3/**']`
   * Defaults to all paths being allowed.
   */
  allowedPaths?: string[];
  /*! Fully typed OpenAPI spec for your API. */
  openApiSpecOverrides?: NextRestFrameworkOpenApiSpec;
  /*! Path that will be used for the OpenAPI spec - defaults tp `/api/openapi.json`. */
  openApiJsonPath?: string;
  /*! Path that will be used for the OpenAPI spec - defaults tp `/api/openapi.json`. */
  openApiYamlPath?: string;
  /*! Path that will be used for the API docs - defaults to `/api/docs`. */
  swaggerUiPath?: string;
  /*! Customization options for Swagger UI. */
  swaggerUiConfig?: {
    /*! Default theme to use for SwaggerUI - defaults to "light". */
    defaultTheme?: 'light' | 'dark';
    /*! Custom HTML title for SwaggerUI - defaults to "Next REST Framework | SwaggerUI". */
    title?: string;
    /*! Custom HTML description for SwaggerUI - defaults to "Next REST Framework SwaggerUI". */
    description?: string;
    /*! Href to a custom favicon for SwaggerUI - defaults to the Next REST Framework favicon. */
    faviconHref?: string;
    /*! Href to a custom logo for SwaggerUI - defaults to the Next REST Framework logo. */
    logoHref?: string;
  };
  /*! Setting this to `false` will expose neither the API docs nor the OpenAPI specs. */
  exposeOpenApiSpec?: boolean;
  /*! A function that will be called when an error occurs within an API handler. Defaults to a 500 status code and a default error message. */
  errorHandler?: ErrorHandler;
  /*! Setting this to `true` will suppress all informational logs from Next REST Framework. */
  suppressInfo?: boolean;
  /*! Timeout in milliseconds for generating the OpenAPI spec. Defaults to 5000. For large applications you might have to increase this. */
  generatePathsTimeout?: number;
}
