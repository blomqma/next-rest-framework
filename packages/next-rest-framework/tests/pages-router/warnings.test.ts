import { NextRestFramework } from '../../src';
import chalk from 'chalk';
import { createApiRouteMocks, resetCustomGlobals } from '../utils';
import { ValidMethod } from '../../src/constants';

jest.mock('fs', () => ({
  readdirSync: () => ['openapi.json.ts', 'openapi.yaml.ts', 'docs.ts'],
  readFileSync: () => '',
  writeFileSync: () => {}
}));

beforeEach(() => {
  resetCustomGlobals();
});

const { defineApiRoute } = NextRestFramework({
  appDirPath: 'app',
  swaggerUiPath: '/api/docs'
});

const handler = defineApiRoute({
  GET: {
    handler: () => {}
  }
});

jest.mock('../../../apps/dev/app/api/openapi.json.ts', () => handler, {
  virtual: true
});

jest.mock('../../../apps/dev/app/api/openapi.yaml.ts', () => handler, {
  virtual: true
});

jest.mock('../../../apps/dev/app/api/docs', () => handler, {
  virtual: true
});

it('warns about reserved openapi.json path', async () => {
  const { req, res } = createApiRouteMocks({
    method: ValidMethod.GET,
    path: '/api/openapi.json'
  });

  console.warn = jest.fn();
  await handler(req, res);

  expect(console.warn).toHaveBeenCalledWith(
    chalk.yellowBright(
      `Warning: ${chalk.bold(
        '/api/openapi.json'
      )} is reserved for OpenAPI JSON spec. Update ${chalk.bold(
        'openApiJsonPath'
      )} in your Next REST Framework config to use this path for other purposes.`
    )
  );
});

it('warns about reserved openapi.yaml path', async () => {
  const { req, res } = createApiRouteMocks({
    method: ValidMethod.GET,
    path: '/api/openapi.yaml'
  });

  console.warn = jest.fn();
  await handler(req, res);

  expect(console.warn).toHaveBeenCalledWith(
    chalk.yellowBright(
      `Warning: ${chalk.bold(
        '/api/openapi.yaml'
      )} is reserved for OpenAPI YAML spec. Update ${chalk.bold(
        'openApiYamlPath'
      )} in your Next REST Framework config to use this path for other purposes.`
    )
  );
});

it('warns about reserved Swagger UI path', async () => {
  const { req, res } = createApiRouteMocks({
    method: ValidMethod.GET,
    path: '/api/docs'
  });

  console.warn = jest.fn();
  await handler(req, res);

  expect(console.warn).toHaveBeenCalledWith(
    chalk.yellowBright(
      `Warning: ${chalk.bold(
        '/api/docs'
      )} is reserved for Swagger UI. Update ${chalk.bold(
        'swaggerUiPath'
      )} in your Next REST Framework config to use this path for other purposes.`
    )
  );
});

it('warns about `apiRoutesPath` not found', async () => {
  const { req, res } = createApiRouteMocks({
    method: ValidMethod.GET,
    path: '/api'
  });

  console.warn = jest.fn();

  await NextRestFramework({
    apiRoutesPath: 'src/pages/api/does-not-exist'
  }).defineCatchAllApiRoute()(req, res);

  expect(console.warn).toHaveBeenCalledWith(
    chalk.yellowBright(
      `Warning: You have enabled the ${chalk.bold(
        'apiRoutesPath'
      )} option in your Next REST Framework config, but the directory does not exist at ${chalk.bold(
        'src/pages/api/does-not-exist'
      )}.`
    )
  );
});
