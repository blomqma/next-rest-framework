import { NextRestFramework } from 'next-rest-framework';

export const { defineCatchAllHandler, defineEndpoints } = NextRestFramework({
  apiRoutesPath: 'src/pages/api',
  openApiJsonPath: '/api/foo/openapi.json',
  openApiYamlPath: '/api/bar/openapi.yaml',
  middleware: () => ({ foo: 'foo', bar: 'bar', baz: 'baz' })
});
