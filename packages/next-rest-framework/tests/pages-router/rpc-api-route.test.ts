import { validateSchema } from '../../src/shared';
import { DEFAULT_ERRORS, ValidMethod } from '../../src/constants';
import { z } from 'zod';
import { rpcApiRoute, rpcOperation } from '../../src';
import { createMockRpcApiRouteRequest } from '../utils';
import { zfd } from 'zod-form-data';

describe('rpcApiRoute', () => {
  it.each(Object.values(ValidMethod))(
    'only works with HTTP method POST: %p',
    async (method) => {
      const { req, res } = createMockRpcApiRouteRequest({
        method
      });

      const data = ['All good!'];

      const operation = rpcOperation()
        .outputs([
          { body: z.array(z.string()), contentType: 'application/json' }
        ])
        .handler(() => data);

      await rpcApiRoute({
        test: operation
      })(req, res);

      if (method === ValidMethod.POST) {
        const json = res._getJSONData();
        expect(res.statusCode).toEqual(200);
        expect(json).toEqual(data);
      } else {
        expect(res.statusCode).toEqual(405);
        expect(res.getHeader('Allow')).toEqual('POST');
      }
    }
  );

  it('returns error for missing operation', async () => {
    const { req, res } = createMockRpcApiRouteRequest({
      operation: 'does-not-exist'
    });

    await rpcApiRoute({
      // @ts-expect-error: Intentionally invalid.
      test: rpcOperation().handler()
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(400);

    expect(json).toEqual({
      message: DEFAULT_ERRORS.operationNotAllowed
    });
  });

  it('returns error for missing handlers', async () => {
    const { req, res } = createMockRpcApiRouteRequest();

    await rpcApiRoute({
      // @ts-expect-error: Intentionally invalid (empty handler).
      test: rpcOperation().handler()
    })(req, res);

    expect(res.statusCode).toEqual(400);

    expect(res._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.notImplemented
    });

    const { req: req2, res: res2 } = createMockRpcApiRouteRequest();

    await rpcApiRoute({
      // Handler doesn't return anything.
      test: rpcOperation().handler(() => {})
    })(req2, res2);

    expect(res2.statusCode).toEqual(400);

    expect(res2._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.notImplemented
    });
  });

  it('returns error for invalid request body', async () => {
    const body = {
      foo: 'bar'
    };

    const { req, res } = createMockRpcApiRouteRequest({
      body,
      headers: {
        'content-type': 'application/json'
      }
    });

    const schema = z.object({
      foo: z.number()
    });

    await rpcApiRoute({
      test: rpcOperation()
        .input({ contentType: 'application/json', body: schema })
        .handler(() => {})
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(400);

    const { errors } = validateSchema({ schema, obj: body });

    expect(json).toEqual({
      message: DEFAULT_ERRORS.invalidRequestBody,
      errors
    });
  });

  it('returns error for invalid content-type', async () => {
    const { req, res } = createMockRpcApiRouteRequest({
      method: ValidMethod.POST,
      body: {
        foo: 'bar'
      },
      headers: {
        'content-type': 'application/xml'
      }
    });

    await rpcApiRoute({
      test: rpcOperation()
        .input({
          contentType: 'application/json',
          body: z.object({
            foo: z.string()
          })
        })
        .handler(() => {})
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(400);

    expect(json).toEqual({
      message: DEFAULT_ERRORS.invalidMediaType
    });
  });

  it('works with application/json', async () => {
    const { req, res } = createMockRpcApiRouteRequest({
      method: ValidMethod.POST,
      body: {
        foo: 'bar'
      },
      headers: {
        'content-type': 'application/json'
      }
    });

    await rpcApiRoute({
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
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(200);
    expect(json).toEqual({ foo: 'bar' });
  });

  it('works with application/x-www-form-urlencoded', async () => {
    const { req, res } = createMockRpcApiRouteRequest({
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

    await rpcApiRoute({
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
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(200);

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

    const { req, res } = createMockRpcApiRouteRequest({
      method: ValidMethod.POST,
      body,
      headers: {
        'content-type': 'multipart/form-data'
      }
    });

    const schema = z.object({
      foo: z.string(),
      bar: z.string().optional(),
      baz: z.string()
    });

    await rpcApiRoute({
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
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(200);

    expect(json).toEqual({
      foo: 'bar',
      bar: null,
      baz: 'qux'
    });
  });

  it('returns a default error response and logs the error', async () => {
    const { req, res } = createMockRpcApiRouteRequest({
      method: ValidMethod.POST
    });

    console.error = jest.fn();

    await rpcApiRoute({
      test: rpcOperation().handler(() => {
        throw Error('Something went wrong');
      })
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(400);

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

    const { req, res } = createMockRpcApiRouteRequest({
      body,
      headers: { 'content-type': 'application/json' }
    });

    const schema = z.object({
      foo: z.number()
    });

    console.log = jest.fn();

    await rpcApiRoute({
      test: rpcOperation()
        .input({ contentType: 'application/json', body: schema })
        .middleware(() => {
          console.log('foo');
        })
        .handler(() => {})
    })(req, res);

    expect(console.log).toHaveBeenCalledWith('foo');

    const { errors } = validateSchema({ schema, obj: body });

    expect(res._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.invalidRequestBody,
      errors
    });

    expect(res.statusCode).toEqual(400);
  });

  it('does not execute handler if middleware throws an error', async () => {
    const { req, res } = createMockRpcApiRouteRequest();

    console.log = jest.fn();

    await rpcApiRoute({
      test: rpcOperation()
        .middleware(() => {
          throw Error("I'm an error!");
        })
        .handler(() => {
          console.log('foo');
        })
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(400);

    expect(json).toEqual({
      message: DEFAULT_ERRORS.unexpectedError
    });

    expect(console.log).not.toHaveBeenCalled();
  });

  it('passes data between middleware and handler', async () => {
    const { req, res } = createMockRpcApiRouteRequest({
      body: { foo: 'bar' },
      headers: {
        'content-type': 'application/json'
      }
    });

    console.log = jest.fn();

    await rpcApiRoute({
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
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(200);

    expect(json).toEqual({
      bar: 'baz'
    });

    expect(console.log).toHaveBeenNthCalledWith(1, { foo: 'bar' });
    expect(console.log).toHaveBeenNthCalledWith(2, { foo: 'bar' });
    expect(console.log).toHaveBeenNthCalledWith(3, { bar: 'baz' });
  });

  it('allows chaining three middlewares', async () => {
    const { req, res } = createMockRpcApiRouteRequest();

    console.log = jest.fn();

    await rpcApiRoute({
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
    })(req, res);

    const json = res._getJSONData();
    expect(res.statusCode).toEqual(200);

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
});
