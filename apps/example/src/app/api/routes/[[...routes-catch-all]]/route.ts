import { defineRoute } from 'next-rest-framework';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const GET = defineRoute({
  GET: {
    output: [
      {
        status: 200,
        contentType: 'text/plain',
        schema: z.string()
      }
    ],
    handler: () => {
      return NextResponse.json('Hello from app router catch all handler!', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
});
