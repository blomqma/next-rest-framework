import { type OpenAPIV3_1 } from 'openapi-types';
import { type Modify } from './utility-types';
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
  /*! Overrides to the generated OpenAPI spec. */
  openApiSpecOverrides?: NextRestFrameworkOpenApiSpec;
  /*! Path that will be used for fetching the OpenAPI spec - defaults to `/openapi.json`. This path also determines the path where this file will be generated inside the `public` folder. */
  openApiJsonPath?: string;
  /*! Setting this to `false` will not automatically update the generated OpenAPI spec when calling the Next REST Framework endpoint. Defaults to `true`. */
  autoGenerateOpenApiSpec?: boolean;
  /*! Customization options for the generate docs. */
  docsConfig?: {
    /*! Custom HTML title. */
    title?: string;
    /*! Custom HTML description. */
    description?: string;
    /*! Custom favicon URL. */
    faviconUrl?: string;
    /*! Custom logo URL. */
    logoUrl?: string;
  };
  /*! Setting this to `true` will suppress all informational logs from Next REST Framework. Defaults to `false`. */
  suppressInfo?: boolean;
  /*! Timeout in milliseconds for generating the OpenAPI spec. Defaults to 5000. For large applications you might have to increase this. */
  generatePathsTimeout?: number;
}
