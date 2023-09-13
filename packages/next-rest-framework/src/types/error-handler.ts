/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { type NextResponse, type NextRequest } from 'next/server';
import { type NextApiRequest } from 'next/types';

export type ErrorHandler = ({
  req,
  error
}: {
  req: NextRequest | NextApiRequest;
  error: unknown;
}) => Promise<NextResponse | void> | NextResponse | void;
