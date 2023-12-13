import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS, NEXT_REST_FRAMEWORK_USER_AGENT } from '../constants';
import { type BaseQuery, type NextRestFrameworkConfig } from '../types';
import {
  fetchOasDataFromDev,
  getConfig,
  syncOpenApiSpec,
  logInitInfo,
  logNextRestFrameworkError,
  getHtmlForDocs
} from '../shared';

export const docsRoute = (_config?: NextRestFrameworkConfig) => {
  const config = getConfig(_config);

  const handler = async (req: NextRequest, _context: { params: BaseQuery }) => {
    try {
      const { headers, nextUrl } = req;
      const host = headers.get('host') ?? '';

      if (process.env.NODE_ENV !== 'production') {
        const proto = headers.get('x-forwarded-proto') ?? 'http';
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

        if (config.autoGenerateOpenApiSpec) {
          const nrfOasData = await fetchOasDataFromDev({
            config,
            baseUrl,
            url
          });

          await syncOpenApiSpec({ config, nrfOasData });
        }
      }

      const html = getHtmlForDocs({ config, host });

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

  handler._nextRestFrameworkConfig = config;
  return { GET: handler };
};
