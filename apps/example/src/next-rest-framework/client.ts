import { NextRestFramework } from 'next-rest-framework';

export const {
  defineCatchAllRoute,
  defineRoute,
  defineCatchAllApiRoute,
  defineApiRoute
} = NextRestFramework({
  appDirPath: 'src/app',
  apiRoutesPath: 'src/pages/api',
  openApiJsonPath: '/api/foo/openapi.json',
  openApiYamlPath: '/api/bar/openapi.yaml'
});
