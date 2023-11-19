import { validateSchema } from '../../src/shared';
import { DEFAULT_ERRORS, ValidMethod } from '../../src/constants';
import { z } from 'zod';
import { rpcApiRouteHandler, rpcOperation } from '../../src';
import { createMockRpcApiRouteRequest } from '../utils';

it.each(Object.values(ValidMethod))(
  'only works with HTTP method POST: %p',
  async (method) => {
    const { req, res } = createMockRpcApiRouteRequest({
      method
    });

    const data = ['All good!'];

    const operation = rpcOperation()
      .output([{ schema: z.array(z.string()) }])
      .handler(() => data);

    await rpcApiRouteHandler({
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

  await rpcApiRouteHandler({
    // @ts-expect-error: Intentionally invalid.
    test: rpcOperation().handler()
  })(req, res);

  const json = res._getJSONData();
  expect(res.statusCode).toEqual(400);

  expect(json).toEqual({
    message: DEFAULT_ERRORS.operationNotAllowed
  });
});

it('returns error for invalid request body', async () => {
  const body = {
    foo: 'bar'
  };

  const { req, res } = createMockRpcApiRouteRequest({
    body
  });

  const schema = z.object({
    foo: z.number()
  });

  await rpcApiRouteHandler({
    test: rpcOperation()
      .input(schema)
      .handler(() => {})
  })(req, res);

  const json = res._getJSONData();
  expect(res.statusCode).toEqual(400);

  const { errors } = await validateSchema({ schema, obj: body });

  expect(json).toEqual({
    message: DEFAULT_ERRORS.invalidRequestBody,
    errors
  });
});

it('returns a default error response', async () => {
  const { req, res } = createMockRpcApiRouteRequest();

  console.error = jest.fn();

  await rpcApiRouteHandler({
    test: rpcOperation().handler(() => {
      throw Error('Something went wrong');
    })
  })(req, res);

  const json = res._getJSONData();
  expect(res.statusCode).toEqual(500);

  expect(json).toEqual({
    message: DEFAULT_ERRORS.unexpectedError
  });
});

it('executes middleware before validating input', async () => {
  const body = {
    foo: 'bar'
  };

  const { req, res } = createMockRpcApiRouteRequest({ body });

  const schema = z.object({
    foo: z.number()
  });

  console.log = jest.fn();

  await rpcApiRouteHandler({
    test: rpcOperation()
      .input(schema)
      .middleware(() => {
        console.log('foo');
      })
      .handler(() => {})
  })(req, res);

  expect(console.log).toHaveBeenCalledWith('foo');

  const { errors } = await validateSchema({ schema, obj: body });

  expect(res._getJSONData()).toEqual({
    message: DEFAULT_ERRORS.invalidRequestBody,
    errors
  });

  expect(res.statusCode).toEqual(400);
});

it('does not execute handler if middleware returns a response', async () => {
  const { req, res } = createMockRpcApiRouteRequest();

  console.log = jest.fn();

  await rpcApiRouteHandler({
    test: rpcOperation()
      .middleware(() => {
        return { foo: 'bar' };
      })
      .handler(() => {
        console.log('foo');
      })
  })(req, res);

  const json = res._getJSONData();
  expect(res.statusCode).toEqual(200);

  expect(json).toEqual({
    foo: 'bar'
  });

  expect(console.log).not.toHaveBeenCalled();
});
