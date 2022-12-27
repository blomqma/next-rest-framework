import { defineEndpoints } from 'next-rest-framework/client';
import { object, string } from 'zod';

export default defineEndpoints({
  POST: {
    input: {
      contentType: 'application/json',
      schema: object({
        foo: string()
      })
    },
    output: [
      {
        status: 200,
        contentType: 'application/json',
        schema: object({
          bar: string()
        })
      }
    ],
    handler: async ({
      res,
      req: {
        body: { foo }
      }
    }) => {
      res.setHeader('content-type', 'application/json');
      res.status(200).json({ bar: foo });
    }
  }
});
