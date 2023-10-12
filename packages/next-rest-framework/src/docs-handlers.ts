import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS } from './constants';
import { type NextRestFrameworkConfig } from './types';
import { getConfig, syncOpenApiSpec } from './utils';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { getHtmlForDocs } from './utils/docs';
import { logInitInfo, logNextRestFrameworkError } from './utils/logging';

export const defineDocsRoute = (_config?: NextRestFrameworkConfig) => {
  const config = getConfig(_config);

  return async (
    req: NextRequest,
    _context: { params: Record<string, unknown> }
  ) => {
    try {
      const { headers, url } = req;
      const proto = new URL(url).protocol;
      const host = headers.get('host');
      const baseUrl = `${proto}//${host}`;

      if (!config.suppressInfo) {
        logInitInfo({ config, baseUrl, url });
      }

      if (config.autoGenerateOpenApiSpec) {
        await syncOpenApiSpec({ config, baseUrl, url });
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
};

export const defineDocsApiRoute = (_config?: NextRestFrameworkConfig) => {
  const config = getConfig(_config);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const proto = req.headers['x-forwarded-proto'] ?? 'http';
      const host = req.headers.host;
      const baseUrl = `${proto}://${host}`;
      const url = baseUrl + req.url;

      if (!config.suppressInfo) {
        logInitInfo({ config, baseUrl, url });
      }

      if (config.autoGenerateOpenApiSpec) {
        await syncOpenApiSpec({ config, baseUrl, url });
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
};
