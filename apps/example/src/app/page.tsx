import { Footer } from '@/app/components/Footer';
import { Navbar } from '@/app/components/Navbar';

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl grow w-full flex flex-col justify-center items-center gap-4 p-4">
        <h1 className="text-5xl font-bold">Next REST Framework</h1>
        <p className="text-xl">Type-safe, self-documenting APIs for Next.js</p>
        <div className="flex gap-4">
          <a
            href="https://github.com/blomqma/next-rest-framework"
            target="_blank"
          >
            <button className="btn btn-primary gap-4">
              Star on GitHub
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          </a>
          <a href="https://next-rest-framework.vercel.app/" target="_blank">
            <button className="btn btn-outline gap-4">
              Read docs
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </button>
          </a>
        </div>
        <ul className="flex gap-4">
          <li>
            <a className="link link-primary" href="/api/v2">
              Redoc
            </a>
          </li>
          <li>
            <a className="link link-primary" href="/api/v1">
              SwaggerUI
            </a>
          </li>
          <li>
            <a className="link link-primary" href="/openapi.json">
              openapi.json
            </a>
          </li>
          <li>
            <a className="link link-primary" href="/client">
              RPC client example
            </a>
          </li>
        </ul>
      </main>
      <Footer />
    </>
  );
}
