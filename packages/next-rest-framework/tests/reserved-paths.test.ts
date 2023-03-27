import { NextRestFramework } from '../src';
import chalk from 'chalk';
import { createNextRestFrameworkMocks, resetCustomGlobals } from './utils';
import { z } from 'zod';
import * as yup from 'yup';

jest.mock('fs', () => ({
  readdirSync: () => ['openapi.json.ts', 'openapi.yaml.ts', 'docs.ts'],
  readFileSync: () => '',
  writeFileSync: () => {}
}));

beforeEach(() => {
  resetCustomGlobals();
});

const { defineEndpoints } = NextRestFramework({
  swaggerUiPath: '/api/docs'
});

const inputSchema = z.object({
  name: z.string(),
  age: z.number(),
  isCool: z.boolean(),
  hobbies: z.array(z.object({ name: z.string() }))
});

const outputSchema = yup.object({
  name: yup.string(),
  age: yup.number(),
  isCool: yup.boolean(),
  hobbies: yup.array(yup.object({ name: yup.string() }))
});

const openApiSpecHandler = defineEndpoints({
  POST: {
    input: {
      contentType: 'application/json',
      body: inputSchema
    },
    output: [
      {
        status: 201,
        schema: outputSchema,
        contentType: 'application/json'
      }
    ],
    handler: ({ req: { body }, res }) => {
      res.status(201).json(body);
    }
  }
});

const swaggerUiHandler = defineEndpoints({
  PUT: {
    input: {
      contentType: 'application/json',
      body: inputSchema
    },
    output: [
      {
        status: 203,
        schema: outputSchema,
        contentType: 'application/json'
      }
    ],
    handler: ({ req: { body }, res }) => {
      res.status(203).json(body);
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
