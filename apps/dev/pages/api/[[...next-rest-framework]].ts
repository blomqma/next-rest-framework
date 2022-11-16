import { defineCatchAllHandler } from 'next-rest-framework/client';
import * as z from 'zod';

export default defineCatchAllHandler({
  GET: {
    responses: [
      {
        status: 200,
        contentType: 'text/plain',
        schema: z.string()
      }
    ],
    handler: ({ res }) => {
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send('Hello, world!');
    }
  }
});
