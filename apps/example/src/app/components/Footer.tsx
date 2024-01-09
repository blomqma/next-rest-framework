import Image from 'next/image';

export const Footer: React.FC = () => (
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
        <Image
          src="https://next-rest-framework.vercel.app/img/logo.svg"
          alt="Next REST Framework logo"
          width={30}
          height={30}
        />
      </p>
    </div>
  </footer>
);
