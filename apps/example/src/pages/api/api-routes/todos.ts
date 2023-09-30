import { defineApiRoute } from 'next-rest-framework/client';
import { z } from 'zod';

export default defineApiRoute({
  GET: {
    output: [
      {
        status: 200,
        contentType: 'application/json',
        schema: z.object({
          foo: z.string(),
          bar: z.string(),
          baz: z.string(),
          qux: z.string()
        })
      }
    ],
    handler: (_req, res) => {
      res.status(200).json({ foo: 'foo', bar: 'bar', baz: 'baz', qux: 'qux' });
    }
  },
  POST: {
    input: {
      contentType: 'application/json',
      body: z.object({
        foo: z.string(),
        bar: z.number()
      })
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: z.object({
          foo: z.string(),
          bar: z.number()
        })
      }
    ],
    handler: ({ body: { foo, bar } }, res) => {
      res.status(201).json({ foo, bar });
    }
  }
});
