import { DEFAULT_ERRORS } from '../constants';
import { type NextRestFrameworkConfig } from '../types';
import { getConfig } from '../shared';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { getHtmlForDocs } from '../shared/docs';
import {
  logNextRestFrameworkError,
  logPagesEdgeRuntimeErrorForRoute
} from '../shared/logging';
import { type NextRequest } from 'next/server';

export const docsApiRoute = (_config?: NextRestFrameworkConfig) => {
  const config = getConfig(_config);

  const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (typeof EdgeRuntime === 'string') {
      const edgeRequest = req as unknown as NextRequest;
      const route = decodeURIComponent(edgeRequest.nextUrl.pathname ?? '');
      logPagesEdgeRuntimeErrorForRoute(route);

      return Response.json(
        { message: DEFAULT_ERRORS.unexpectedError },
        {
          status: 500,
          headers: {
            'content-type': 'application/json'
          }
        }
      );
    }

    try {
      const host = req.headers.host ?? '';
      const html = getHtmlForDocs({ config, host });
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      logNextRestFrameworkError(error);
      res.status(500).json({ message: DEFAULT_ERRORS.unexpectedError });
    }
  };

  handler._nextRestFrameworkConfig = config;
  return handler;
};
