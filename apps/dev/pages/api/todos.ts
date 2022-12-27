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
      schema: z.object({
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
          bar: z.number(),
          qux: z.array(
            z.object({
              qux: z.string()
            })
          )
        })
      }
    ],
    middleware: () => ({
      qux: 'qux'
    }),
    handler: async ({
      req: {
        body: { foo, bar }
      },
      res,
      params: { qux }
    }) => {
      res.status(201).json({ foo, bar, qux: [{ qux }] });
    }
  },
  PUT: {
    input: {
      contentType: 'application/json',
      schema: yup.object({
        foo: yup.array(
          yup.object({
            bar: yup.string()
          })
        ),
        baz: yup.number()
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
          qux: yup.string()
        })
      }
    ],
    middleware: () => ({
      qux: 'qux'
    }),
    handler: async ({
      req: {
        body: { foo }
      },
      res,
      params: { qux }
    }) => {
      res.status(201).json({ foo, bar: 0, qux });
    }
  }
});
