import { defineApiRoute } from 'next-rest-framework/client';
import { z } from 'zod';

export default defineApiRoute({
  GET: {
    output: [
      {
        status: 200,
        contentType: 'text/plain',
        schema: z.string()
      }
    ],
    handler: (_req, res) => {
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send('Hello from pages router catch all handler!');
    }
  }
});
