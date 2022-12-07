import { NextRestFramework } from '../src';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { defaultResponses, getPathsFromMethodHandlers } from '../src/utils';
import { createNextRestFrameworkMocks, resetCustomGlobals } from './utils';
import {
  TypedNextApiRequest,
  TypedNextApiResponse,
  DefineEndpointsParams
} from '../src/types';

jest.mock('fs', () => ({
  readdirSync: () => [
    'foo.ts',
    'foo/bar.ts',
    'foo/bar/baz.ts',
    'foo/bar/[qux]/index.ts'
  ]
}));

beforeEach(() => {
  resetCustomGlobals();
});

const fooMethodHandlers = {
  POST: {
    responses: [
      {
        description: 'foo',
        status: 201,
        schema: z.string(),
        contentType: 'application/json'
      }
    ],
    handler: ({
      req: { body },
      res
    }: {
      req: TypedNextApiRequest<{ name: string }>;
      res: TypedNextApiResponse<201, 'application/json', string>;
    }) => {
      res.status(201).json(body.name);
    },
    requestBody: {
      contentType: 'application/json',
      schema: z.object({
        name: z.string()
      })
    }
  }
};

const fooBarMethodHandlers = {
  PUT: {
    responses: [
      {
        description: 'bar',
        status: 203,
        schema: z.string(),
        contentType: 'application/json'
      }
    ],
    handler: ({
      req: { body },
      res
    }: {
      req: TypedNextApiRequest<{ name: string }>;
      res: TypedNextApiResponse<203, 'application/json', string>;
    }) => {
      res.status(203).json(body.name);
    },
    requestBody: {
      contentType: 'application/json',
      schema: z.object({
        name: z.string()
      })
    }
  }
};

const fooBarBazMethodHandlers = {
  GET: {
    responses: [
      {
        description: 'baz',
        status: 200,
        schema: z.string(),
        contentType: 'application/json'
      }
    ],
    handler: ({
      res
    }: {
      res: TypedNextApiResponse<200, 'application/json', string>;
    }) => {
      res.status(200).send('baz');
    }
  }
};

const fooBarBazQuzMethodHandlers = {
  GET: {
    responses: [
      {
        description: 'qux',
        status: 200,
        schema: z.string(),
        contentType: 'application/json'
      }
    ],
    handler: ({
      res
    }: {
      res: TypedNextApiResponse<200, 'application/json', string>;
    }) => {
      res.status(200).send('qux');
    }
  }
};

jest.mock(
  '../../../apps/dev/pages/api/foo',
  () =>
    NextRestFramework().defineEndpoints(
      fooMethodHandlers as DefineEndpointsParams
    ),
  { virtual: true }
);

jest.mock(
  '../../../apps/dev/pages/api/foo/bar',
  () =>
    NextRestFramework().defineEndpoints(
      fooBarMethodHandlers as DefineEndpointsParams
    ),
  { virtual: true }
);

jest.mock(
  '../../../apps/dev/pages/api/foo/bar/baz',
  () =>
    NextRestFramework().defineEndpoints(
      fooBarBazMethodHandlers as DefineEndpointsParams
    ),
  { virtual: true }
);

jest.mock(
  '../../../apps/dev/pages/api/foo/bar/[qux]/index',
  () =>
    NextRestFramework().defineEndpoints(
      fooBarBazQuzMethodHandlers as DefineEndpointsParams
    ),
  { virtual: true }
);

// @ts-expect-error: TS expects the mock function to extend the typings of the global `fetch` function but we don't need those types here.
global.fetch = (url: string) => {
  const route = url.replace('http://localhost:3000', '');
  console.log('route', route);

  const handlersForPaths = {
    '/api/foo': fooMethodHandlers,
    '/api/foo/bar': fooBarMethodHandlers,
    '/api/foo/bar/baz': fooBarBazMethodHandlers,
    '/api/foo/bar/{qux}': fooBarBazQuzMethodHandlers
  };

  const methodHandlers = handlersForPaths[
    route as keyof typeof handlersForPaths
  ] as DefineEndpointsParams;
  const data = getPathsFromMethodHandlers({ methodHandlers, route });

  return {
    json: async () => await Promise.resolve(data)
  };
};

it('auto-generates responses', async () => {
  const { req, res } = createNextRestFrameworkMocks({
    method: 'GET',
    path: '/api/openapi.json'
  });

  await NextRestFramework().defineCatchAllHandler()(req, res);
  const { paths } = res._getJSONData();

  console.log('paths', paths);

  expect(paths['/api/foo'].post.responses).toEqual({
    ...defaultResponses,
    201: {
      description: 'foo',
      content: {
        'application/json': {
          schema: zodToJsonSchema(z.string())
        }
      }
    }
  });

  expect(paths['/api/foo/bar'].put.responses).toEqual({
    ...defaultResponses,
    203: {
      description: 'bar',
      content: {
        'application/json': {
          schema: zodToJsonSchema(z.string())
        }
      }
    }
  });

  expect(paths['/api/foo/bar/baz'].get.responses).toEqual({
    ...defaultResponses,
    200: {
      description: 'baz',
      content: {
        'application/json': {
          schema: zodToJsonSchema(z.string())
        }
      }
    }
  });

  expect(paths['/api/foo/bar/{qux}'].get.responses).toEqual({
    ...defaultResponses,
    200: {
      description: 'qux',
      content: {
        'application/json': {
          schema: zodToJsonSchema(z.string())
        }
      }
    }
  });
});
