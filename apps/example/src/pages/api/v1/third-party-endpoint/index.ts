import { type NextApiRequest, type NextApiResponse } from 'next';

// You can still write regular API routes with Next REST Framework.
const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Content-Type', 'text/plain');
  res.json('Hello  World!');
};

export default handler;
