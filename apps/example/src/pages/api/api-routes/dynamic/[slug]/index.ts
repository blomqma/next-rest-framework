import { defineApiRoute } from 'next-rest-framework/client';
import { z } from 'zod';

export default defineApiRoute({
  GET: {
    input: {
      query: z.object({
        slug: z.string()
      })
    },
    handler: ({ query: { slug } }, res) => {
      res.status(200).send(`Hello from slug: ${slug}`);
    }
  }
});
