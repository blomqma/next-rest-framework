import { defineRoute } from 'next-rest-framework';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const handler = defineRoute({
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
    handler: async (req) => {
      const { foo, bar } = await req.json();

      return NextResponse.json(
        {
          foo,
          bar
        },
        {
          status: 201
        }
      );
    }
  }
});

export { handler as GET, handler as POST, handler as PUT };
