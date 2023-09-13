import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS, ValidMethod } from './constants';
import { type NextRestFrameworkConfig } from './types';
import {
  logReservedPaths,
  getHTMLForSwaggerUI,
  getOrCreateOpenApiSpec,
  logInitInfo
} from './utils';
import yaml from 'js-yaml';
import { type DefineRouteParams } from './types/define-route';
import { type TypedNextRequest } from './types/request';
import { defineRoute } from './define-route';

export const defineCatchAllRoute = ({
  config
}: {
  config: NextRestFrameworkConfig;
}) => {
  return (methodHandlers: DefineRouteParams = {}) => {
    return async (
      req: NextRequest,
      context: { params: Record<string, unknown> }
    ) => {
      try {
        const { method, headers, nextUrl } = req;
        const { pathname } = nextUrl;

        const proto =
          headers.get('proto') ?? headers.get('x-forwarded-proto') ?? 'http';

        const host = headers.get('host');
        const baseUrl = `${proto}://${host}`;

        const {
          openApiJsonPath,
          openApiYamlPath,
          swaggerUiPath,
          exposeOpenApiSpec,
          suppressInfo
        } = config;

        if (!suppressInfo) {
          logInitInfo({ config });

          if (!global.reservedPathsLogged) {
            logReservedPaths({ config, baseUrl });
          }
        }

        if (
          [openApiJsonPath, openApiYamlPath, swaggerUiPath].includes(
            pathname
          ) &&
          exposeOpenApiSpec &&
          method === ValidMethod.GET
        ) {
          const spec = await getOrCreateOpenApiSpec({ config, baseUrl });

          if (pathname === swaggerUiPath) {
            const html = getHTMLForSwaggerUI({ config, baseUrl });

            return new NextResponse(html, {
              headers: {
                'Content-Type': 'text/html'
              },
              status: 200
            });
          }

          if (pathname === openApiJsonPath) {
            return NextResponse.json(spec, { status: 200 });
          }

          if (pathname === openApiYamlPath) {
            return new NextResponse(yaml.dump(spec), {
              headers: {
                'Content-Type': 'text/plain'
              },
              status: 200
            });
          }
        }

        if (!methodHandlers[method as keyof typeof methodHandlers]) {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.notFound },
            { status: 404 }
          );
        }

        return await defineRoute({
          config
        })(methodHandlers)(
          req as TypedNextRequest<Record<string, unknown>>,
          context
        );
      } catch (error) {
        const res = await config.errorHandler?.({ req, error });

        if (res) {
          return res;
        } else {
          return NextResponse.json(
            { message: DEFAULT_ERRORS.unexpectedError },
            { status: 500 }
          );
        }
      }
    };
  };
};
