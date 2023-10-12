import { defineRoute } from 'next-rest-framework';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const GET = defineRoute({
  GET: {
    input: {
      query: z.object({
        slug: z.string()
      })
    },
    handler: (_req, { params: { slug } }) => {
      return NextResponse.json(`Hello from slug: ${slug}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
});
