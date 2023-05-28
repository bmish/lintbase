import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full px-2 py-4 bg-white sm:px-4 shadow-xl">
      <div className="flex items-center justify-between mx-auto max-w-7xl">
        <Link href="/">
          <span className="text-2xl font-extrabold text-blue-600">
            LINTBASE
          </span>
        </Link>
        <div className="flex items-center space-x-1">
          <ul className="hidden space-x-2 md:inline-flex">
            <li>
              <Link
                href="/plugins"
                className="px-4 py-2 font-semibold text-gray-600 rounded"
              >
                Plugins
              </Link>
            </li>
            <li>
              <Link
                href="/rules"
                className="px-4 py-2 font-semibold text-gray-600 rounded"
              >
                Rules
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="px-4 py-2 font-semibold text-gray-600 rounded"
              >
                About
              </Link>
            </li>
          </ul>
          <div className="inline-flex md:hidden">
            <button className="flex-none px-2 ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 8h16M4 16h16"
                />
              </svg>
              <span className="sr-only">Open Menu</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
