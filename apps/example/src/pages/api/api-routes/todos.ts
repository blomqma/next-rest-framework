import { defineApiRoute } from 'next-rest-framework/client';
import { z } from 'zod';

export default defineApiRoute({
  GET: {
    output: [
      {
        status: 200,
        contentType: 'text/html',
        schema: z.object({
          foo: z.string(),
          bar: z.string(),
          baz: z.string(),
          qux: z.string()
        })
      }
    ],
    handler: (_req, res) => {
      res.setHeader('content-type', 'text/html');
      res.status(200).json({ foo: 'foo', bar: 'bar', baz: 'baz', qux: 'qux' });
    }
  },
  POST: {
    input: {
      contentType: 'application/json',
      body: z.object({
        foo: z.string(),
        bar: z.number()
      }),
      query: z.object({
        test: z.string()
      })
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: z.object({
          foo: z.string(),
          bar: z.number(),
          query: z.object({
            test: z.string()
          })
        })
      }
    ],
    handler: ({ body: { foo, bar }, query: { test } }, res) => {
      res.status(201).json({ foo, bar, query: { test } });
    }
  },
  PUT: {
    input: {
      contentType: 'application/json',
      body: z.object({
        foo: z.array(
          z.object({
            bar: z.string()
          })
        ),
        baz: z.number()
      }),
      query: z.object({
        test: z.string()
      })
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: z.object({
          foo: z.array(
            z.object({
              bar: z.string()
            })
          ),
          bar: z.number(),
          query: z.object({
            test: z.string()
          })
        })
      }
    ],
    handler: ({ body: { foo }, query: { test } }, res) => {
      res.status(201).json({ foo, bar: 0, query: { test } });
    }
  }
});
