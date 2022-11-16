import { NextRestFramework } from '../src';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { DEFAULT_RESPONSES } from '../src/generate-paths';
import { createNextRestFrameworkMocks, resetCustomGlobals } from './utils';

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

jest.mock(
  '../../../apps/dev/pages/api/foo',
  () =>
    NextRestFramework().defineEndpoints({
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
    }),
  { virtual: true }
);

jest.mock(
  '../../../apps/dev/pages/api/foo/bar',
  () =>
    NextRestFramework().defineEndpoints({
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
    }),
  { virtual: true }
);

jest.mock(
  '../../../apps/dev/pages/api/foo/bar/baz',
  () =>
    NextRestFramework().defineEndpoints({
      GET: {
        responses: [
          {
            description: 'baz',
            status: 200,
            schema: z.string(),
            contentType: 'application/json'
          }
        ],
        handler: ({ res }) => {
          res.status(200).send('baz');
        }
      }
    }),
  { virtual: true }
);

jest.mock(
  '../../../apps/dev/pages/api/foo/bar/[qux]/index',
  () =>
    NextRestFramework().defineEndpoints({
      GET: {
        responses: [
          {
            description: 'qux',
            status: 200,
            schema: z.string(),
            contentType: 'application/json'
          }
        ],
        handler: ({ res }) => {
          res.status(200).send('qux');
        }
      }
    }),
  { virtual: true }
);

it('auto-generates responses', async () => {
  const { req, res } = createNextRestFrameworkMocks({
    method: 'GET',
    path: '/api/openapi.json'
  });

  await NextRestFramework().defineCatchAllHandler()(req, res);
  const { paths } = res._getJSONData();

  expect(paths['/api/foo'].post.responses).toEqual({
    ...DEFAULT_RESPONSES,
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
    ...DEFAULT_RESPONSES,
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
    ...DEFAULT_RESPONSES,
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
    ...DEFAULT_RESPONSES,
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
