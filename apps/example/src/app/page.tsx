'use client';

import { VERSION } from 'next-rest-framework/dist/constants';

export default function Page() {
  const onDarkModeChanged = (theme: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', theme);
    document.cookie = `theme=${theme}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
  };

  return (
    <>
      <div className="navbar bg-base-200 flex justify-center px-5">
        <div className="max-w-7xl flex justify-between grow gap-5 h-24">
          <div className="flex items-center gap-4">
            <a>
              <img
                src="https://next-rest-framework.vercel.app/img/logo.svg"
                alt="Logo"
                className="w-32"
              />
            </a>
            <p>v{VERSION}</p>
          </div>
          <label className="swap swap-rotate">
            <input
              type="checkbox"
              onClick={(e) => {
                onDarkModeChanged(e.currentTarget.checked ? 'dark' : 'light');
              }}
            />
            <svg
              className="swap-on fill-current w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>
            <svg
              className="swap-off fill-current w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
        </div>
      </div>

      <main className="max-w-7xl grow w-full flex flex-col justify-center items-center gap-4">
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
            <a className="link link-primary" href="/api">
              Redoc
            </a>
          </li>
          <li>
            <a className="link link-primary" href="/api/swagger-ui">
              SwaggerUI
            </a>
          </li>
          <li>
            <a className="link link-primary" href="/openapi.json">
              openapi.json
            </a>
          </li>
        </ul>
      </main>
      <footer className="footer bg-base-200 flex justify-center">
        <div className="container max-w-5xl flex flex-col items-center text-md gap-5 px-5 py-2">
          <p className="text-center text-sm flex flex-wrap items-center gap-2">
            Built with
            <a
              href="https://github.com/blomqma/next-rest-framework"
              className="link"
            >
              Next REST Framework
            </a>
            <img
              src="https://next-rest-framework.vercel.app/img/logo.svg"
              alt="Next REST Framework logo"
              className="w-10"
            />
          </p>
        </div>
      </footer>
    </>
  );
}
