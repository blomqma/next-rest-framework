import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ERRORS } from '../constants';
import { type BaseQuery, type NextRestFrameworkConfig } from '../types';
import {
  logNextRestFrameworkError,
  getHtmlForDocs,
  getConfig
} from '../shared';

export const docsRoute = (_config?: NextRestFrameworkConfig) => {
  const config = getConfig(_config);

  const handler = async (req: NextRequest, _context: { params: BaseQuery }) => {
    try {
      const host = req.headers.get('host') ?? '';
      const html = getHtmlForDocs({ config, host });

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html'
        }
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

  return {
    GET: handler
  };
};
