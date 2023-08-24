export const DEFAULT_MESSAGES = {
  created: 'Created',
  noContent: 'No content'
};

export const DEFAULT_ERRORS = {
  unexpectedError: 'An unknown error occurred, trying again might help.',
  methodNotAllowed: 'Method not allowed.',
  notFound: 'Not found.',
  invalidMediaType: 'Invalid media type.'
};

export const OPEN_API_VERSION = '3.0.1';

export enum ValidMethod {
  GET = 'GET',
  PUT = 'PUT',
  POST = 'POST',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
  PATCH = 'PATCH'
}

export const NEXT_REST_FRAMEWORK_USER_AGENT = 'next-rest-framework';

// Ignore: We don't want to use promises here to avoid making this an async function.
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
