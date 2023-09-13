import { NextResponse } from 'next/server';

export const GET = () => {
  return NextResponse.json('Server error', {
    status: 500,
    headers: { 'Content-Type': 'text/plain' }
  });
};
