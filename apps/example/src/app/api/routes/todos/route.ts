import { defineRoute } from 'next-rest-framework/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const GET = defineRoute({
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
    handler: () => {
      return NextResponse.json(
        { foo: 'foo', bar: 'bar', baz: 'baz', qux: 'qux' },
        {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }
  }
});

export const POST = defineRoute({
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
    handler: async (req, { params: { test } }) => {
      const { foo, bar } = await req.json();

      return NextResponse.json(
        { foo, bar, query: { test } },
        {
          status: 201
        }
      );
    }
  }
});

export const PUT = defineRoute({
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
    handler: async (req, { params: { test } }) => {
      const { foo } = await req.json();

      return NextResponse.json(
        { foo, bar: 0, query: { test } },
        {
          status: 201
        }
      );
    }
  }
});
