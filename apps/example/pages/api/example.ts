import { object, string } from 'zod';
import { defineEndpoints } from 'next-rest-framework/client';

export default defineEndpoints({
  POST: {
    requestBody: {
      contentType: 'application/json',
      schema: object({
        bar: string()
      })
    },
    responses: [
      {
        status: 200,
        contentType: 'text/html',
        schema: object({
          bar: string()
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
