import { defineEndpoints } from 'next-rest-framework/client';
import { z } from 'zod';

export default defineEndpoints({
  GET: {
    input: {
      query: z.object({
        slug: z.string()
      })
    },
    handler: ({
      req: {
        query: { slug }
      },
      res
    }) => {
      res.status(200).send(`Hello from slug: ${slug}`);
    }
  }
});
