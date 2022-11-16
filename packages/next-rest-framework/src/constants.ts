export const DEFAULT_MESSAGES = {
  created: 'Created',
  noContent: 'No content'
};

export const DEFAULT_ERRORS = {
  unexpectedError: 'An unknown error occurred, trying again might help.',
  methodNotAllowed: 'Method not allowed.',
  notFound: 'Not found.',
  unsupportedMediaType: 'Unsupported media type.'
};

export const OPEN_API_VERSION = '3.0.1';

export enum ValidMethod {
  GET = 'GET',
  PUT = 'PUT',
  POST = 'POST',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
  PATCH = 'PATCH',
  TRACE = 'TRACE'
}
