import { NextRestFramework } from '../../src';
import * as openApiUtils from '../../src/utils/open-api';
import {
  complexZodSchema,
  createApiRouteMocks,
  expectComplexSchemaResponse,
  expectOpenAPIGenerationErrors,
  resetCustomGlobals
} from '../utils';
import {
  NEXT_REST_FRAMEWORK_USER_AGENT,
  ValidMethod
} from '../../src/constants';
import { z } from 'zod';

const createDirent = (name: string) => ({
  isDirectory: () => false,
  name
});

jest.mock('fs', () => ({
  readdirSync: () =>
    ['foo.ts', 'foo/bar.ts', 'foo/bar/baz.ts', 'foo/bar/[qux]/index.ts'].map(
      createDirent
    ),
  writeFileSync: () => {}
}));

beforeEach(() => {
  resetCustomGlobals();
});

const { defineCatchAllApiRoute, defineApiRoute } = NextRestFramework({
  appDirPath: 'src/pages/api'
});

const fooMethodHandlers = defineApiRoute({
  POST: {
    input: {
      contentType: 'application/json',
      body: complexZodSchema,
      query: z.object({
        foo: z.string()
      })
    },
    output: [
      {
        status: 201,
        schema: complexZodSchema,
        contentType: 'application/json'
      }
    ],
    handler: async (req, res) => {
      res.status(201).json(req.body);
    }
  }
});

const fooBarMethodHandlers = defineApiRoute({
  PUT: {
    input: {
      contentType: 'application/json',
      body: complexZodSchema,
      query: z.object({
        foo: z.string()
      })
    },
    output: [
      {
        status: 203,
        schema: complexZodSchema,
        contentType: 'application/json'
      }
    ],
    handler: async (req, res) => {
      res.status(203).json(req.body);
    }
  }
});

const fooBarBazMethodHandlers = defineApiRoute({
  GET: {
    output: [
      {
        status: 200,
        schema: complexZodSchema,
        contentType: 'application/json'
      }
    ],
    handler: async (req, res) => {
      res.status(200).json(req.body);
    }
  }
});

const fooBarBazQuxMethodHandlers = defineApiRoute({
  GET: {
    output: [
      {
        status: 200,
        schema: complexZodSchema,
        contentType: 'application/json'
      }
    ],
    handler: async (req, res) => {
      res.status(200).json(req.body);
    }
  }
});

jest.mock(
  '../../../apps/src/dev/app/api/foo/route.ts',
  () => fooMethodHandlers,
  {
    virtual: true
  }
);

jest.mock(
  '../../../apps/src/dev/app/api/foo/bar/route.ts',
  () => fooBarBazMethodHandlers,
  { virtual: true }
);

jest.mock(
  '../../../apps/src/dev/app/api/foo/bar/baz/route.ts',
  () => fooBarBazMethodHandlers,
  { virtual: true }
);

jest.mock(
  '../../../apps/src/dev/app/api/foo/bar/[qux]/route.ts',
  () => fooBarBazQuxMethodHandlers,
  { virtual: true }
);

// @ts-expect-error: TS expects the mock function to extend the typings of the global `fetch` function but we don't need those types here.
global.fetch = async (url: string) => {
  const path = url.replace('http://localhost:3000', '');

  const { req, res } = createApiRouteMocks({
    method: ValidMethod.GET,
    path,
    query: {
      foo: 'bar'
    },
    headers: {
      'user-agent': NEXT_REST_FRAMEWORK_USER_AGENT
    }
  });

  const handlersForPaths = {
    '/api/foo': fooMethodHandlers,
    '/api/foo/bar': fooBarMethodHandlers,
    '/api/foo/bar/baz': fooBarBazMethodHandlers,
    '/api/foo/bar/{qux}': fooBarBazQuxMethodHandlers
  };

  const methodHandlers =
    handlersForPaths[path as keyof typeof handlersForPaths];

  await methodHandlers(req, res);

  return {
    json: () => res._getJSONData(),
    status: 200
  };
};

it('auto-generates the paths from the internal endpoint responses', async () => {
  const { req, res } = createApiRouteMocks({
    method: ValidMethod.GET,
    path: '/api/openapi.json'
  });

  await defineCatchAllApiRoute()(req, res);
  const { paths } = await res._getJSONData();
  expectComplexSchemaResponse(paths);
});

it('handles error if the OpenAPI spec generation fails', async () => {
  console.error = jest.fn();

  jest.mock('../../src/utils/open-api', () => {
    return {
      __esModule: true,
      ...jest.requireActual('../src/utils/open-api')
    };
  });

  const error = 'Something went wrong';

  jest
    .spyOn(openApiUtils, 'getPathsFromMethodHandlers')
    .mockImplementation(() => {
      throw Error(error);
    });

  const { req, res } = createApiRouteMocks({
    method: ValidMethod.GET,
    path: '/api/openapi.json'
  });

  await defineCatchAllApiRoute()(req, res);
  const { paths } = res._getJSONData();
  expect(paths).toEqual({});
  expectOpenAPIGenerationErrors(error);
});
