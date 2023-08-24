import { NextRestFramework } from '../../src';
import chalk from 'chalk';
import { createNextRestFrameworkMocks, resetCustomGlobals } from '../utils';
import { ValidMethod } from '../../src/constants';

jest.mock('fs', () => ({
  readdirSync: () => ['openapi.json.ts', 'openapi.yaml.ts', 'docs.ts'],
  readFileSync: () => '',
  writeFileSync: () => {}
}));

beforeEach(() => {
  resetCustomGlobals();
});

const { defineRoute } = NextRestFramework({
  appDirPath: 'src/pages/api',
  swaggerUiPath: '/api/docs'
});

const openApiSpecHandler = defineRoute({
  GET: {
    handler: () => {}
  }
});

const swaggerUiHandler = defineRoute({
  GET: {
    handler: () => {}
  }
});

jest.mock(
  '../../../apps/dev/pages/api/openapi.json.ts',
  () => openApiSpecHandler,
  { virtual: true }
);

jest.mock(
  '../../../apps/dev/pages/api/openapi.yaml.ts',
  () => openApiSpecHandler,
  { virtual: true }
);

jest.mock('../../../apps/dev/pages/api/docs', () => swaggerUiHandler, {
  virtual: true
});

it('warns about reserved openapi.json path', async () => {
  const { req, context } = createNextRestFrameworkMocks({
    method: ValidMethod.GET,
    path: '/api/openapi.json'
  });

  console.warn = jest.fn();
  await openApiSpecHandler(req, context);

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
  const { req, context } = createNextRestFrameworkMocks({
    method: ValidMethod.GET,
    path: '/api/openapi.yaml'
  });

  console.warn = jest.fn();
  await openApiSpecHandler(req, context);

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
  const { req, context } = createNextRestFrameworkMocks({
    method: ValidMethod.GET,
    path: '/api/docs'
  });

  console.warn = jest.fn();
  await openApiSpecHandler(req, context);

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
