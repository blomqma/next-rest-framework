import { defineEndpoints } from 'next-rest-framework/client';
import * as z from 'zod';

export default defineEndpoints({
  GET: {
    responses: [
      {
        status: 200,
        contentType: 'application/json',
        schema: z.object({
          foo: z.string()
        })
      }
    ],
    handler: ({ res }) => {
      res.status(200).json({ foo: 'bar' });
    }
  }
});
