import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from './constants';
import { type BaseQuery, type NextRestFrameworkConfig } from './types';
import { generatePathsFromDev, getConfig, syncOpenApiSpec } from './utils';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { getHtmlForDocs } from './utils/docs';
import { logNextRestFrameworkError } from './utils/logging';
import { isEqualWith } from 'lodash';
import chalk from 'chalk';

const logInitInfo = ({
  config,
  baseUrl,
  url
}: {
  config: Required<NextRestFrameworkConfig>;
  baseUrl: string;
  url: string;
}) => {
  const configsEqual = isEqualWith(global.nextRestFrameworkConfig, config);

  const logReservedPaths = () => {
    console.info(
      chalk.yellowBright(`Docs: ${url}
OpenAPI JSON: ${baseUrl}${config.openApiJsonPath}`)
    );
  };

  if (!global.nextRestFrameworkConfig) {
    global.nextRestFrameworkConfig = config;
    console.info(chalk.green('Next REST Framework initialized! 🚀'));
    logReservedPaths();
  } else if (!configsEqual) {
    console.info(
      chalk.green('Next REST Framework config changed, re-initializing!')
    );

    global.nextRestFrameworkConfig = config;
    logReservedPaths();
  }
};

export const docsRouteHandler = (_config?: NextRestFrameworkConfig) => {
  const config = getConfig(_config);

  const handler = async (req: NextRequest, _context: { params: BaseQuery }) => {
    try {
      const { headers, nextUrl } = req;

      const proto = headers.get('x-forwarded-proto');

      if (!proto) {
        return NextResponse.json(
          {
            message: 'The request is missing `x-forwarded-proto` header.'
          },
          { status: 401 }
        );
      }

      const host = headers.get('host');

      if (!host) {
        return NextResponse.json(
          {
            message: 'The request is missing `host` header.'
          },
          { status: 401 }
        );
      }

      const baseUrl = `${proto}://${host}`;
      const url = baseUrl + nextUrl.pathname;

      // Return 403 if called internally by the framework.
      if (headers.get('user-agent') === NEXT_REST_FRAMEWORK_USER_AGENT) {
        return NextResponse.json(
          {
            message: `${NEXT_REST_FRAMEWORK_USER_AGENT} user agent is not allowed.`
          },
          { status: 403 }
        );
      }

      if (!config.suppressInfo) {
        logInitInfo({ config, baseUrl, url });
      }

      if (
        process.env.NODE_ENV !== 'production' &&
        config.autoGenerateOpenApiSpec
      ) {
        const paths = await generatePathsFromDev({ config, baseUrl, url });
        await syncOpenApiSpec({ config, paths });
      }

      const html = getHtmlForDocs({ config, baseUrl });

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html'
        },
        status: 200
      });
    } catch (error) {
      logNextRestFrameworkError(error);

      return NextResponse.json(
        { message: DEFAULT_ERRORS.unexpectedError },
        { status: 500 }
      );
    }
  };

  handler.nextRestFrameworkConfig = config;
  return handler;
};

export const docsApiRouteHandler = (_config?: NextRestFrameworkConfig) => {
  const config = getConfig(_config);

  const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Return 403 if called internally by the framework.
      if (req.headers['user-agent'] === NEXT_REST_FRAMEWORK_USER_AGENT) {
        res.status(403).json({
          message: `${NEXT_REST_FRAMEWORK_USER_AGENT} user agent is not allowed.`
        });

        return;
      }

      const proto = req.headers['x-forwarded-proto'];

      if (!proto) {
        return NextResponse.json(
          {
            message: 'The request is missing `x-forwarded-proto` header.'
          },
          { status: 401 }
        );
      }

      const host = req.headers.host;

      if (!host) {
        return NextResponse.json(
          {
            message: 'The request is missing `host` header.'
          },
          { status: 401 }
        );
      }

      const baseUrl = `${proto}://${host}`;
      const url = baseUrl + req.url;

      if (!config.suppressInfo) {
        logInitInfo({ config, baseUrl, url });
      }

      if (
        process.env.NODE_ENV !== 'production' &&
        config.autoGenerateOpenApiSpec
      ) {
        const paths = await generatePathsFromDev({ config, baseUrl, url });
        await syncOpenApiSpec({ config, paths });
      }

      const html = getHtmlForDocs({
        config,
        baseUrl
      });

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      logNextRestFrameworkError(error);
      res.status(500).json({ message: DEFAULT_ERRORS.unexpectedError });
    }
  };

  handler.nextRestFrameworkConfig = config;
  return handler;
};
