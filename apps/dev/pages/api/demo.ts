import z from 'zod';
import { defineEndpoints } from 'next-rest-framework/client';

export default defineEndpoints({
  POST: {
    requestBody: {
      contentType: 'application/json',
      schema: z.object({
        bar: z.string()
      })
    },
    responses: [
      {
        status: 200,
        contentType: 'text/html',
        schema: z.object({
          bar: z.string()
        })
      }
    ],
    handler: async ({
      res,
      req: {
        body: { bar }
      }
    }) => {
      res.setHeader('content-type', 'text/html');
      res.status(200).json({ bar });
    }
  }
});
