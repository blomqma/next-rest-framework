import { NextRestFramework } from '../../src';
import * as openApiUtils from '../../src/utils/open-api';
import {
  createNextRestFrameworkMocks,
  expectPathsResponse,
  expectOpenAPIGenerationErrors,
  resetCustomGlobals
} from '../utils';
import {
  NEXT_REST_FRAMEWORK_USER_AGENT,
  ValidMethod
} from '../../src/constants';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import chalk from 'chalk';

const createDirent = (name: string) => ({
  isDirectory: () => false,
  name
});

jest.mock('fs', () => ({
  readdirSync: () =>
    [
      'foo/route.ts',
      'foo/bar/route.ts',
      'foo/bar/baz/route.ts',
      'foo/bar/[qux]/route.ts'
    ].map(createDirent),
  writeFileSync: () => {}
}));

beforeEach(() => {
  resetCustomGlobals();
});

const { defineCatchAllRoute, defineRoute } = NextRestFramework({
  appDirPath: 'src/app/api'
});

const schema = z.object({ foo: z.string() });

const fooMethodHandlers = defineRoute({
  POST: {
    input: {
      contentType: 'application/json',
      body: schema,
      query: z.object({
        foo: z.string()
      })
    },
    output: [
      {
        status: 201,
        schema,
        contentType: 'application/json'
      }
    ],
    handler: async (req) => {
      const body = await req.json();
      return NextResponse.json(body, { status: 201 });
    }
  }
});

const fooBarMethodHandlers = defineRoute({
  PUT: {
    input: {
      contentType: 'application/json',
      body: schema,
      query: z.object({
        foo: z.string()
      })
    },
    output: [
      {
        status: 203,
        schema,
        contentType: 'application/json'
      }
    ],
    handler: async (req) => {
      const body = await req.json();
      return NextResponse.json(body, { status: 203 });
    }
  }
});

const fooBarBazMethodHandlers = defineRoute({
  GET: {
    output: [
      {
        status: 200,
        schema,
        contentType: 'application/json'
      }
    ],
    handler: async (req) => {
      const body = await req.json();
      return NextResponse.json(body, { status: 200 });
    }
  }
});

const fooBarBazQuxMethodHandlers = defineRoute({
  GET: {
    output: [
      {
        status: 200,
        schema,
        contentType: 'application/json'
      }
    ],
    handler: async (req) => {
      const body = await req.json();
      return NextResponse.json(body, { status: 200 });
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

  const { req, context } = createNextRestFrameworkMocks({
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

  const res = await methodHandlers(req, context);
  const json = async () => await res?.json();

  return {
    json,
    status: 200
  };
};

it('auto-generates the paths from the internal endpoint responses', async () => {
  const { req, context } = createNextRestFrameworkMocks({
    method: ValidMethod.GET,
    path: '/api/openapi.json'
  });

  const res = await defineCatchAllRoute()(req, context);
  const { paths } = await res?.json();
  expectPathsResponse({ zodSchema: schema, paths });
});

it.each([
  {
    allowedPaths: ['*'],
    expectedPathsToBeAllowed: [],
    expectedPathsToBeIgnored: [
      '/api/foo',
      '/api/foo/bar',
      '/api/foo/bar/baz',
      '/api/foo/bar/{qux}'
    ]
  },
  {
    allowedPaths: ['**'],
    expectedPathsToBeAllowed: [
      '/api/foo',
      '/api/foo/bar',
      '/api/foo/bar/baz',
      '/api/foo/bar/{qux}'
    ],
    expectedPathsToBeIgnored: []
  },
  {
    allowedPaths: ['/api/foo'],
    expectedPathsToBeAllowed: ['/api/foo'],
    expectedPathsToBeIgnored: [
      '/api/foo/bar',
      '/api/foo/bar/baz',
      '/api/foo/bar/{qux}'
    ]
  },
  {
    allowedPaths: ['/api/foo/*/baz'],
    expectedPathsToBeAllowed: ['/api/foo/bar/baz'],
    expectedPathsToBeIgnored: ['/api/foo', '/api/foo/bar', '/api/foo/bar/{qux}']
  },
  {
    allowedPaths: ['/api/foo/**'],
    expectedPathsToBeAllowed: [
      '/api/foo/bar',
      '/api/foo/bar/baz',
      '/api/foo/bar/{qux}'
    ],
    expectedPathsToBeIgnored: ['/api/foo']
  }
])(
  'auto-generates the paths from the internal endpoint responses when allowing specific routes: $allowedPaths',
  async ({
    allowedPaths,
    expectedPathsToBeAllowed,
    expectedPathsToBeIgnored
  }) => {
    console.info = jest.fn();

    const { req, context } = createNextRestFrameworkMocks({
      method: ValidMethod.GET,
      path: '/api/openapi.json'
    });

    const res = await NextRestFramework({
      appDirPath: 'src/app/api',
      allowedPaths
    }).defineCatchAllRoute()(req, context);

    const { paths } = await res?.json();

    expectPathsResponse({
      zodSchema: schema,
      paths,
      allowedPaths: expectedPathsToBeAllowed
    });

    if (expectedPathsToBeIgnored.length) {
      expect(console.info).toHaveBeenNthCalledWith(
        3,
        chalk.yellowBright(
          `The following paths are ignored by Next REST Framework: ${chalk.bold(
            expectedPathsToBeIgnored.map((p) => `\n- ${p}`)
          )}`
        )
      );
    }
  }
);

it.each([
  {
    deniedPaths: ['*'],
    expectedPathsToBeDenied: []
  },
  {
    deniedPaths: ['**'],
    expectedPathsToBeDenied: [
      '/api/foo',
      '/api/foo/bar',
      '/api/foo/bar/baz',
      '/api/foo/bar/{qux}'
    ]
  },
  {
    deniedPaths: ['/api/foo'],
    expectedPathsToBeDenied: ['/api/foo']
  },
  {
    deniedPaths: ['/api/foo/*/baz'],
    expectedPathsToBeDenied: ['/api/foo/bar/baz']
  },
  {
    deniedPaths: ['/api/foo/**'],
    expectedPathsToBeDenied: [
      '/api/foo/bar',
      '/api/foo/bar/baz',
      '/api/foo/bar/{qux}'
    ]
  }
])(
  'auto-generates the paths from the internal endpoint responses when denying specific routes: $deniedPaths',
  async ({ deniedPaths, expectedPathsToBeDenied }) => {
    console.info = jest.fn();

    const { req, context } = createNextRestFrameworkMocks({
      method: ValidMethod.GET,
      path: '/api/openapi.json'
    });

    const res = await NextRestFramework({
      appDirPath: 'src/app/api',
      deniedPaths
    }).defineCatchAllRoute()(req, context);

    const { paths } = await res?.json();

    expectPathsResponse({
      zodSchema: schema,
      paths,
      deniedPaths: expectedPathsToBeDenied
    });

    if (expectedPathsToBeDenied.length) {
      expect(console.info).toHaveBeenNthCalledWith(
        3,
        chalk.yellowBright(
          `The following paths are ignored by Next REST Framework: ${chalk.bold(
            expectedPathsToBeDenied.map((p) => `\n- ${p}`)
          )}`
        )
      );
    }
  }
);

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

  const { req, context } = createNextRestFrameworkMocks({
    method: ValidMethod.GET,
    path: '/api/openapi.json'
  });

  const res = await defineCatchAllRoute()(req, context);
  const { paths } = await res?.json();
  expect(paths).toEqual({});
  expectOpenAPIGenerationErrors(error);
});
