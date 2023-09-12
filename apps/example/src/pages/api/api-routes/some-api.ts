import { type NextApiRequest, type NextApiResponse } from 'next';

export default (_req: NextApiRequest, res: NextApiResponse) => {
  res.status(500).send('Server error');
};
