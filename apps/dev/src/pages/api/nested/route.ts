import { defineEndpoints } from 'next-rest-framework/client';

export default defineEndpoints({
  GET: {
    handler: ({ res }) => {
      res.setHeader('content-type', 'application/json');
      res.status(200).send('Hello World!');
    }
  }
});
