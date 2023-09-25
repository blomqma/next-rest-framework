import { DEFAULT_ERRORS, ValidMethod } from './constants';
import { type NextRestFrameworkConfig } from './types';
import {
  logReservedPaths,
  getHTMLForSwaggerUI,
  getOrCreateOpenApiSpec,
  logInitInfo
} from './utils';
import yaml from 'js-yaml';
import { type DefineApiRouteParams } from './types/define-route';
import { type TypedNextApiRequest } from './types/request';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { defineApiRoute } from './define-api-route';

export const defineCatchAllApiRoute = ({
  config
}: {
  config: NextRestFrameworkConfig;
}) => {
  return (methodHandlers: DefineApiRouteParams = {}) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        const { method, headers, url: pathname, cookies } = req;
        const proto = headers['x-forwarded-proto'] ?? 'http';
        const host = headers.host;
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

          if (pathname === openApiJsonPath) {
            res.status(200).json(spec);
            return;
          }

          if (pathname === openApiYamlPath) {
            res.setHeader('Content-Type', 'text/plain');
            res.status(200).send(yaml.dump(spec));
            return;
          }

          if (pathname === swaggerUiPath) {
            const html = getHTMLForSwaggerUI({
              config,
              baseUrl,
              theme: cookies.theme
            });

            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(html);
            return;
          }
        }

        if (!methodHandlers[method as keyof typeof methodHandlers]) {
          res.status(404).json({ message: DEFAULT_ERRORS.notFound });
          return;
        }

        await defineApiRoute({ config })(methodHandlers)(
          req as TypedNextApiRequest<
            Record<string, unknown>,
            Record<string, unknown>
          >,
          res
        );
      } catch (error) {
        await config.errorHandler?.({ req, error });

        if (!res.writableEnded) {
          res.status(500).json({ message: DEFAULT_ERRORS.unexpectedError });
        }
      }
    };
  };
};
