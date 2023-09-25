import { cookies } from 'next/headers';

export const metadata = {
  title: 'Next REST Framework Example',
  description: 'Example application for Next REST Framework'
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const theme = cookieStore.get('theme')?.value ?? 'dark';

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
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
