import { validateSchema } from '../../src/shared';
import { DEFAULT_ERRORS, ValidMethod } from '../../src/constants';
import { createMockRpcRouteRequest } from '../utils';
import { z } from 'zod';
import { rpcOperation, rpcRoute } from '../../src';
import { zfd } from 'zod-form-data';

describe('rpcRoute', () => {
  it.each(Object.values(ValidMethod))(
    'only works with HTTP method POST: %p',
    async (method) => {
      const { req, context } = createMockRpcRouteRequest({
        method
      });

      const data = ['All good!'];

      const operation = rpcOperation()
        .outputs([
          { body: z.array(z.string()), contentType: 'application/json' }
        ])
        .handler(() => data);

      const res = await rpcRoute({
        test: operation
      }).POST(req, context);

      if (method === ValidMethod.POST) {
        const json = await res?.json();
        expect(res?.status).toEqual(200);
        expect(json).toEqual(data);
      } else {
        expect(res?.status).toEqual(405);
        expect(res?.headers.get('Allow')).toEqual('POST');
      }
    }
  );

  it('returns error for missing operation', async () => {
    const { req, context } = createMockRpcRouteRequest({
      operation: 'does-not-exist'
    });

    const res = await rpcRoute({
      // @ts-expect-error: Intentionally invalid.
      test: rpcOperation().handler()
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(400);

    expect(json).toEqual({
      message: DEFAULT_ERRORS.operationNotAllowed
    });
  });

  it('returns error for missing handlers', async () => {
    const { req, context } = createMockRpcRouteRequest();

    const res = await rpcRoute({
      // @ts-expect-error: Intentionally invalid (empty handler).
      test: rpcOperation().handler()
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(400);

    expect(json).toEqual({
      message: DEFAULT_ERRORS.notImplemented
    });

    const res2 = await rpcRoute({
      // Handler doesn't return anything.
      test: rpcOperation().handler(() => {})
    }).POST(req, context);

    const json2 = await res2?.json();
    expect(res2?.status).toEqual(400);

    expect(json2).toEqual({
      message: DEFAULT_ERRORS.notImplemented
    });
  });

  it('returns error for invalid request body', async () => {
    const body = {
      foo: 'bar'
    };

    const { req, context } = createMockRpcRouteRequest({
      body,
      headers: { 'content-type': 'application/json' }
    });

    const schema = z.object({
      foo: z.number()
    });

    const res = await rpcRoute({
      test: rpcOperation()
        .input({
          contentType: 'application/json',
          body: schema
        })
        .handler(() => {})
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(400);

    const { errors } = validateSchema({ schema, obj: body });

    expect(json).toEqual({
      message: DEFAULT_ERRORS.invalidRequestBody,
      errors
    });
  });

  it('returns error for invalid content-type', async () => {
    const { req, context } = createMockRpcRouteRequest({
      method: ValidMethod.POST,
      body: {
        foo: 'bar'
      },
      headers: {
        'content-type': 'application/xml'
      }
    });

    const res = await rpcRoute({
      test: rpcOperation()
        .input({
          contentType: 'application/json',
          body: z.object({
            foo: z.string()
          })
        })
        .handler(() => {})
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(400);

    expect(json).toEqual({
      message: DEFAULT_ERRORS.invalidMediaType
    });
  });

  it('works with application/json', async () => {
    const { req, context } = createMockRpcRouteRequest({
      method: ValidMethod.POST,
      body: {
        foo: 'bar'
      },
      headers: {
        'content-type': 'application/json'
      }
    });

    const res = await rpcRoute({
      test: rpcOperation()
        .input({
          contentType: 'application/json',
          body: z.object({
            foo: z.string()
          })
        })
        .outputs([
          {
            body: z.object({
              foo: z.string()
            }),
            contentType: 'application/json'
          }
        ])
        .handler(({ foo }) => ({ foo }))
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(200);
    expect(json).toEqual({ foo: 'bar' });
  });

  it('works with application/x-www-form-urlencoded', async () => {
    const { req, context } = createMockRpcRouteRequest({
      method: ValidMethod.POST,
      body: new URLSearchParams({
        foo: 'bar',
        baz: 'qux'
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    });

    const schema = z.object({
      foo: z.string(),
      bar: z.string().optional(),
      baz: z.string()
    });

    const res = await rpcRoute({
      test: rpcOperation()
        .input({
          contentType: 'application/x-www-form-urlencoded',
          body: zfd.formData(schema)
        })
        .outputs([
          {
            body: schema,
            contentType: 'application/json'
          }
        ])
        .handler((formData) => {
          return {
            foo: formData.get('foo'),
            bar: formData.get('bar'),
            baz: formData.get('baz')
          };
        })
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(200);

    expect(json).toEqual({
      foo: 'bar',
      bar: null,
      baz: 'qux'
    });
  });

  it('works with multipart/form-data', async () => {
    const body = new FormData();
    body.append('foo', 'bar');
    body.append('baz', 'qux');

    const { req, context } = createMockRpcRouteRequest({
      method: ValidMethod.POST,
      body
    });

    const schema = z.object({
      foo: z.string(),
      bar: z.string().optional(),
      baz: z.string()
    });

    const res = await rpcRoute({
      test: rpcOperation()
        .input({
          contentType: 'multipart/form-data',
          body: zfd.formData(schema)
        })
        .outputs([
          {
            body: schema,
            contentType: 'application/json'
          }
        ])
        .handler(async (formData) => ({
          foo: formData.get('foo'),
          bar: formData.get('bar'),
          baz: formData.get('baz')
        }))
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(200);

    expect(json).toEqual({
      foo: 'bar',
      bar: null,
      baz: 'qux'
    });
  });

  it('returns a default error response and logs the error', async () => {
    const { req, context } = createMockRpcRouteRequest({
      method: ValidMethod.POST
    });

    console.error = jest.fn();

    const res = await rpcRoute({
      test: rpcOperation().handler(() => {
        throw Error('Something went wrong');
      })
    }).POST(req, context);

    const json = await res?.json();

    expect(json).toEqual({
      message: DEFAULT_ERRORS.unexpectedError
    });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Something went wrong')
    );
  });

  it('executes middleware before validating input', async () => {
    const body = {
      foo: 'bar'
    };

    const { req, context } = createMockRpcRouteRequest({
      body,
      headers: { 'content-type': 'application/json' }
    });

    const schema = z.object({
      foo: z.number()
    });

    console.log = jest.fn();

    const res = await rpcRoute({
      test: rpcOperation()
        .input({
          contentType: 'application/json',
          body: schema
        })
        .middleware(() => {
          console.log('foo');
        })
        .handler(() => {})
    }).POST(req, context);

    expect(console.log).toHaveBeenCalledWith('foo');

    const json = await res?.json();
    expect(res?.status).toEqual(400);

    const { errors } = validateSchema({ schema, obj: body });

    expect(json).toEqual({
      message: DEFAULT_ERRORS.invalidRequestBody,
      errors
    });
  });

  it('does not execute handler if middleware throws an error', async () => {
    const { req, context } = createMockRpcRouteRequest();

    console.log = jest.fn();

    const res = await rpcRoute({
      test: rpcOperation()
        .middleware(() => {
          throw Error("I'm an error!");
        })
        .handler(() => {
          console.log('foo');
        })
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(400);

    expect(json).toEqual({
      message: DEFAULT_ERRORS.unexpectedError
    });

    expect(console.log).not.toHaveBeenCalled();
  });

  it('passes data between middleware and handler', async () => {
    const { req, context } = createMockRpcRouteRequest({
      body: { foo: 'bar' },
      headers: { 'content-type': 'application/json' }
    });

    console.log = jest.fn();

    const res = await rpcRoute({
      test: rpcOperation()
        .input({
          contentType: 'application/json',
          body: z.object({ foo: z.string() })
        })
        .middleware((input) => {
          console.log(input);
          return { bar: 'baz' };
        })
        .handler((input, options) => {
          console.log(input);
          console.log(options);
          return options;
        })
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(200);

    expect(json).toEqual({
      bar: 'baz'
    });

    expect(console.log).toHaveBeenNthCalledWith(1, { foo: 'bar' });
    expect(console.log).toHaveBeenNthCalledWith(2, { foo: 'bar' });
    expect(console.log).toHaveBeenNthCalledWith(3, { bar: 'baz' });
  });

  it('allows chaining three middlewares', async () => {
    const { req, context } = createMockRpcRouteRequest();

    console.log = jest.fn();

    const res = await rpcRoute({
      test: rpcOperation()
        .middleware(() => {
          console.log('foo');
          return { foo: 'bar' };
        })
        .middleware((_input, options) => {
          console.log('bar');
          return { ...options, bar: 'baz' };
        })
        .middleware((_input, options) => {
          console.log('baz');
          return { ...options, baz: 'qux' };
        })
        .handler((_input, options) => {
          console.log('handler');
          return options;
        })
    }).POST(req, context);

    const json = await res?.json();
    expect(res?.status).toEqual(200);

    expect(json).toEqual({
      foo: 'bar',
      bar: 'baz',
      baz: 'qux'
    });

    expect(console.log).toHaveBeenCalledWith('foo');
    expect(console.log).toHaveBeenCalledWith('bar');
    expect(console.log).toHaveBeenCalledWith('baz');
    expect(console.log).toHaveBeenCalledWith('handler');
  });

  it('ignores non-object middleware return values when building options', async () => {
    const { req, context } = createMockRpcRouteRequest({
      body: { foo: 'bar' },
      headers: { 'content-type': 'application/json' }
    });

    const res = await rpcRoute({
      test: rpcOperation()
        .input({
          contentType: 'application/json',
          body: z.object({ foo: z.string() })
        })
        .middleware(() => 'noop' as any)
        .middleware(() => undefined)
        .middleware(() => 42 as any)
        .handler((_input, options) => options)
    }).POST(req, context);

    const json = await res?.json();
    expect(json).toEqual({});
  });
});
