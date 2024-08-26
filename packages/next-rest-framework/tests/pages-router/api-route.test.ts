import { z } from 'zod';
import { DEFAULT_ERRORS, ValidMethod } from '../../src/constants';
import { validateSchema } from '../../src/shared';
import { createMockApiRouteRequest } from '../utils';
import { apiRoute, apiRouteOperation } from '../../src/pages-router';
import { zfd } from 'zod-form-data';

describe('apiRoute', () => {
  it.each(Object.values(ValidMethod))(
    'works with HTTP method: %p',
    async (method) => {
      const { req, res } = createMockApiRouteRequest({
        method
      });

      const data = ['All good!'];

      const getOperation = (method: keyof typeof ValidMethod) =>
        apiRouteOperation({ method })
          .outputs([
            {
              status: 200,
              contentType: 'application/json',
              body: z.array(z.string())
            }
          ])
          .handler((_req, res) => {
            res.json(data);
          });

      await apiRoute({
        testGet: getOperation('GET'),
        testPut: getOperation('PUT'),
        testPost: getOperation('POST'),
        testDelete: getOperation('DELETE'),
        testOptions: getOperation('OPTIONS'),
        testHead: getOperation('HEAD'),
        testPatch: getOperation('PATCH')
      })(req, res);

      expect(res._getJSONData()).toEqual(data);
    }
  );

  it('returns error for missing handlers', async () => {
    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.GET
    });

    await apiRoute({
      // @ts-expect-error: Intentionally invalid (empty handler).
      test: apiRouteOperation({ method: 'GET' }).handler()
    })(req, res);

    expect(res.statusCode).toEqual(501);

    expect(res._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.notImplemented
    });

    const { req: req2, res: res2 } = createMockApiRouteRequest({
      method: ValidMethod.GET
    });

    await apiRoute({
      // Handler doesn't return anything.
      test: apiRouteOperation({ method: 'GET' }).handler(() => {})
    })(req2, res2);

    expect(res2.statusCode).toEqual(501);

    expect(res2._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.notImplemented
    });
  });

  it('returns error for valid methods with no handlers', async () => {
    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST
    });

    await apiRoute({
      test: apiRouteOperation({ method: 'GET' }).handler(() => {})
    })(req, res);

    expect(res.statusCode).toEqual(405);
    expect(res.getHeader('Allow')).toEqual('GET');

    expect(res._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.methodNotAllowed
    });
  });

  it('returns error for invalid request body', async () => {
    const body = {
      foo: 'bar'
    };

    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      body,
      headers: {
        'content-type': 'application/json'
      }
    });

    const schema = z.object({
      foo: z.number()
    });

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'application/json',
          body: schema
        })
        .handler(() => {})
    })(req, res);

    expect(res.statusCode).toEqual(400);

    const { errors } = validateSchema({ schema, obj: body });

    expect(res._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.invalidRequestBody,
      errors
    });
  });

  it('returns error for invalid query parameters', async () => {
    const query = {
      foo: 'bar'
    };

    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      query,
      headers: {
        'content-type': 'application/json'
      }
    });

    const schema = z.object({
      bar: z.string()
    });

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'application/json',
          query: schema
        })
        .handler(() => {})
    })(req, res);

    expect(res.statusCode).toEqual(400);

    const { errors } = validateSchema({ schema, obj: query });

    expect(res._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.invalidQueryParameters,
      errors
    });
  });

  it('works with valid query parameters', async () => {
    const query = {
      foo: 'bar'
    };

    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      query,
      headers: {
        'content-type': 'application/json'
      }
    });

    const schema = z.object({
      foo: z.string()
    });

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'application/json',
          query: schema
        })
        .outputs([
          {
            status: 200,
            contentType: 'application/json',
            body: z.object({
              foo: z.string()
            })
          }
        ])
        .handler((req, res) => {
          const { foo } = req.query;
          res.json({ foo });
        })
    })(req, res);

    expect(res.statusCode).toEqual(200);

    expect(res._getJSONData()).toEqual({
      foo: 'bar'
    });
  });

  it('returns error for invalid path parameters', async () => {
    const params = {
      foo: 'bar'
    };

    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      params,
      headers: {
        'content-type': 'application/json'
      }
    });

    const schema = z.object({
      bar: z.string()
    });

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'application/json',
          params: schema
        })
        .handler(() => {})
    })(req, res);

    expect(res.statusCode).toEqual(400);

    const { errors } = validateSchema({ schema, obj: params });

    expect(res._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.invalidPathParameters,
      errors
    });
  });

  it('works with valid path parameters', async () => {
    const params = {
      foo: 'bar'
    };

    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      params,
      headers: {
        'content-type': 'application/json'
      }
    });

    const schema = z.object({
      foo: z.string()
    });

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'application/json',
          params: schema
        })
        .outputs([
          {
            status: 200,
            contentType: 'application/json',
            body: z.object({
              foo: z.string()
            })
          }
        ])
        .handler((req, res) => {
          const { foo } = req.query;
          res.json({ foo });
        })
    })(req, res);

    expect(res.statusCode).toEqual(200);

    expect(res._getJSONData()).toEqual({
      foo: 'bar'
    });
  });

  it('returns error for invalid content-type', async () => {
    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      body: {
        foo: 'bar'
      },
      headers: {
        'content-type': 'application/xml'
      }
    });

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'application/json',
          body: z.object({
            foo: z.string()
          })
        })
        .handler(() => {})
    })(req, res);

    expect(res.statusCode).toEqual(415);
    expect(res._getHeaders().allow).toEqual('application/json');

    expect(res._getJSONData()).toEqual({
      message: `${DEFAULT_ERRORS.invalidMediaType} Expected application/json.`
    });
  });

  it('works with application/json', async () => {
    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      body: {
        foo: 'bar'
      },
      headers: {
        'content-type': 'application/json'
      }
    });

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'application/json',
          body: z.object({
            foo: z.string()
          })
        })
        .outputs([
          {
            status: 201,
            contentType: 'application/json',
            body: z.object({
              foo: z.string()
            })
          }
        ])
        .handler((req) => {
          const { foo } = req.body;
          res.json({ foo });
        })
    })(req, res);

    expect(res.statusCode).toEqual(200);
    expect(res._getJSONData()).toEqual({ foo: 'bar' });
  });

  it('works with application/x-www-form-urlencoded', async () => {
    const body = new FormData();
    body.append('foo', 'bar');
    body.append('baz', 'qux');

    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      body,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    });

    const schema = z.object({
      foo: z.string(),
      bar: z.string().optional(),
      baz: z.string()
    });

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'application/x-www-form-urlencoded',
          body: zfd.formData(schema)
        })
        .outputs([
          {
            status: 200,
            contentType: 'application/json',
            body: schema
          }
        ])
        .handler((req, res) => {
          const formData = req.body;

          res.json({
            foo: formData.get('foo'),
            bar: formData.get('bar'),
            baz: formData.get('baz')
          });
        })
    })(req, res);

    expect(res.statusCode).toEqual(200);
    expect(res._getJSONData()).toEqual({ foo: 'bar', bar: null, baz: 'qux' });
  });

  it('works with multipart/form-data', async () => {
    const body = new FormData();
    body.append('foo', 'bar');
    body.append('baz', 'qux');

    const { req, res } = createMockApiRouteRequest({
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

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'multipart/form-data',
          body: zfd.formData(schema)
        })
        .outputs([
          {
            status: 200,
            contentType: 'application/json',
            body: schema
          }
        ])
        .handler((req, res) => {
          const formData = req.body;

          res.json({
            foo: formData.get('foo'),
            bar: formData.get('bar'),
            baz: formData.get('baz')
          });
        })
    })(req, res);

    expect(res.statusCode).toEqual(200);
    expect(res._getJSONData()).toEqual({ foo: 'bar', bar: null, baz: 'qux' });
  });

  it('returns a default error response and logs the error', async () => {
    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.GET
    });

    console.error = jest.fn();

    await apiRoute({
      test: apiRouteOperation({ method: 'GET' }).handler(() => {
        throw Error('Something went wrong');
      })
    })(req, res);

    expect(res._getJSONData()).toEqual({
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

    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      body,
      headers: {
        'content-type': 'application/json'
      }
    });

    const schema = z.object({
      foo: z.number()
    });

    console.log = jest.fn();

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({
          contentType: 'application/json',
          body: schema
        })
        .middleware(() => {
          console.log('foo');
        })
        .handler(() => {})
    })(req, res);

    expect(console.log).toHaveBeenCalledWith('foo');

    expect(res.statusCode).toEqual(400);

    const { errors } = validateSchema({ schema, obj: body });

    expect(res._getJSONData()).toEqual({
      message: DEFAULT_ERRORS.invalidRequestBody,
      errors
    });
  });

  it('does not execute handler if middleware returns an HTTP response', async () => {
    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.GET
    });

    console.log = jest.fn();

    await apiRoute({
      test: apiRouteOperation({ method: 'GET' })
        .middleware(() => {
          res.json({ foo: 'bar' });
        })
        .handler(() => {
          console.log('foo');
        })
    })(req, res);

    expect(res.statusCode).toEqual(200);

    expect(res._getJSONData()).toEqual({
      foo: 'bar'
    });

    expect(console.log).not.toHaveBeenCalled();
  });

  it('passes data between middleware and handler', async () => {
    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.POST,
      body: { foo: 'bar' },
      headers: {
        'content-type': 'application/json'
      }
    });

    console.log = jest.fn();

    await apiRoute({
      test: apiRouteOperation({ method: 'POST' })
        .input({ body: z.object({ foo: z.string() }) })
        .middleware((req) => {
          const body = req.body;
          console.log({ middleware: 1, ...body });
          req.headers = { ...req.headers, 'x-foo': 'custom-header' };
          return { bar: 'baz' };
        })
        .middleware((req, _res, options) => {
          const body = req.body;
          console.log({ middleware: 2, ...body });
          req.headers = { ...req.headers, 'x-bar': 'custom-header-2' };
          return { ...options, baz: 'qux' };
        })
        .handler(async (req, res, options) => {
          const body = req.body;
          console.log({ handler: true, ...body });
          console.log({ options: true, ...options });
          console.log({ 'x-foo': req.headers['x-foo'] });
          console.log({ 'x-bar': req.headers['x-bar'] });
          res.json(options);
        })
    })(req, res);

    expect(res.statusCode).toEqual(200);

    expect(res._getJSONData()).toEqual({
      bar: 'baz',
      baz: 'qux'
    });

    expect(console.log).toHaveBeenNthCalledWith(1, {
      middleware: 1,
      foo: 'bar'
    });

    expect(console.log).toHaveBeenNthCalledWith(2, {
      middleware: 2,
      foo: 'bar'
    });

    expect(console.log).toHaveBeenNthCalledWith(3, {
      handler: true,
      foo: 'bar'
    });

    expect(console.log).toHaveBeenNthCalledWith(4, {
      options: true,
      bar: 'baz',
      baz: 'qux'
    });

    expect(console.log).toHaveBeenNthCalledWith(5, {
      'x-foo': 'custom-header'
    });

    expect(console.log).toHaveBeenNthCalledWith(6, {
      'x-bar': 'custom-header-2'
    });
  });

  it('allows chaining three middlewares', async () => {
    const { req, res } = createMockApiRouteRequest({
      method: ValidMethod.GET
    });

    console.log = jest.fn();

    await apiRoute({
      test: apiRouteOperation({ method: 'GET' })
        .middleware(() => {
          console.log('foo');
          return { foo: 'bar' };
        })
        .middleware((_req, _ctx, options) => {
          console.log('bar');
          return { ...options, bar: 'baz' };
        })
        .middleware((_req, _ctx, options) => {
          console.log('baz');
          return { ...options, baz: 'qux' };
        })
        .handler((_req, res, options) => {
          console.log('handler');
          res.json(options);
        })
    })(req, res);

    expect(res.statusCode).toEqual(200);

    expect(res._getJSONData()).toEqual({
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
