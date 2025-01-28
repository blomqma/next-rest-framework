import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Next REST Framework Example',
  description: 'Example application for Next REST Framework'
};

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value ?? 'light';

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://cdn.jsdelivr.net/npm/daisyui@2.46.0/dist/full.css"
          rel="stylesheet"
          type="text/css"
        />
      </head>
      <body className="min-h-screen flex flex-col items-center">
        {children}
      </body>
    </html>
  );
}
