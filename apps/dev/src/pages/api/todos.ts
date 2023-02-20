import { defineEndpoints } from 'next-rest-framework/client';
import { z } from 'zod';
import * as yup from 'yup';

export default defineEndpoints({
  middleware: ({ params: { foo, bar, baz } }) => ({
    foo: bar,
    bar: baz,
    baz: foo
  }),
  GET: {
    middleware: () => ({
      qux: 'qux'
    }),
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
    handler: async ({ res, params: { foo, bar, baz, qux } }) => {
      res.setHeader('content-type', 'text/html');
      res.status(200).json({ foo, bar, baz, qux });
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
          qux: z.array(
            z.object({
              qux: z.string()
            })
          ),
          query: z.object({
            test: z.string()
          })
        })
      }
    ],
    middleware: () => ({
      qux: 'qux'
    }),
    handler: async ({
      req: {
        body: { foo, bar },
        query: { test }
      },
      res,
      params: { qux }
    }) => {
      res.status(201).json({ foo, bar, qux: [{ qux }], query: { test } });
    }
  },
  PUT: {
    input: {
      contentType: 'application/json',
      body: yup.object({
        foo: yup.array(
          yup.object({
            bar: yup.string()
          })
        ),
        baz: yup.number()
      }),
      query: yup.object({
        test: yup.string()
      })
    },
    output: [
      {
        status: 201,
        contentType: 'application/json',
        schema: yup.object({
          foo: yup.array(
            yup.object({
              bar: yup.string()
            })
          ),
          bar: yup.number(),
          qux: yup.string(),
          query: yup.object({
            test: yup.string()
          })
        })
      }
    ],
    middleware: () => ({
      qux: 'qux'
    }),
    handler: async ({
      req: {
        body: { foo },
        query: { test }
      },
      res,
      params: { qux }
    }) => {
      res.status(201).json({ foo, bar: 0, qux, query: { test } });
    }
  }
});
