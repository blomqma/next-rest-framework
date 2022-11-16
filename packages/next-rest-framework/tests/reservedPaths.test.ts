import { NextRestFramework } from '../src';
import { z } from 'zod';
import chalk from 'chalk';
import { createNextRestFrameworkMocks, resetCustomGlobals } from './utils';

jest.mock('fs', () => ({
  readdirSync: () => ['openapi.json.ts', 'openapi.yaml.ts', 'docs.ts'],
  readFileSync: () => ''
}));

beforeEach(() => {
  resetCustomGlobals();
});

const openApiSpecHandler = NextRestFramework({
  swaggerUiPath: '/api/docs'
}).defineEndpoints({
  POST: {
    responses: [
      {
        description: 'foo',
        status: 201,
        schema: z.string(),
        contentType: 'application/json'
      }
    ],
    handler: ({ req: { body }, res }) => {
      res.status(201).json(body.name);
    },
    requestBody: {
      contentType: 'application/json',
      schema: z.object({
        name: z.string()
      })
    }
  }
});

const swaggerUiHandler = NextRestFramework({
  swaggerUiPath: '/api/docs'
}).defineEndpoints({
  PUT: {
    responses: [
      {
        description: 'bar',
        status: 203,
        schema: z.string(),
        contentType: 'application/json'
      }
    ],
    handler: ({ req: { body }, res }) => {
      res.status(203).json(body.name);
    },
    requestBody: {
      contentType: 'application/json',
      schema: z.object({
        name: z.string()
      })
    }
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
  const { req, res } = createNextRestFrameworkMocks({
    method: 'GET',
    path: '/api/openapi.json',
    body: {
      name: 'foo'
    },
    headers: {
      host: 'localhost:3000'
    }
  });

  console.warn = jest.fn();
  await openApiSpecHandler(req, res);

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
  const { req, res } = createNextRestFrameworkMocks({
    method: 'GET',
    path: '/api/openapi.yaml',
    body: {
      name: 'foo'
    },
    headers: {
      host: 'localhost:3000'
    }
  });

  console.warn = jest.fn();
  await openApiSpecHandler(req, res);

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
  const { req, res } = createNextRestFrameworkMocks({
    method: 'GET',
    path: '/api/docs',
    body: {
      name: 'foo'
    },
    headers: {
      host: 'localhost:3000'
    }
  });

  console.warn = jest.fn();
  await openApiSpecHandler(req, res);

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
