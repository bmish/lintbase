import { TextField } from '@mui/material';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Header() {
  const router = useRouter();

  const [searchValue, setSearchValue] = useState(router.query.q || '');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);

    const SEARCHABLE_PATHS = ['/db/plugins', '/db/rules'];

    const newUrl = SEARCHABLE_PATHS.includes(router.pathname)
      ? router.pathname
      : '/db/plugins';

    if (event.target.value) {
      router.push(`${newUrl}?q=${event.target.value}`);
    } else {
      router.push(newUrl);
    }
  };

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (!url.includes('q=')) {
        setSearchValue('');
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <header className="sticky top-0 z-30 w-full px-2 py-4 bg-white sm:px-4 shadow-xl ">
      <div className="flex items-center justify-between mx-auto max-w-7xl">
        <Link href="/">
          <Image src={'/logo.png'} width={200} height={55} alt="Logo" />
        </Link>

        <div className="flex items-center space-x-1">
          <ul className="hidden space-x-2 md:inline-flex">
            <li>
              <TextField
                type="search"
                placeholder="Search"
                variant="standard"
                value={searchValue}
                onChange={handleChange} // TODO: add debouncing
              ></TextField>
            </li>
            <li>
              <Link
                href="/db"
                className="px-4 py-2 font-semibold text-gray-600 rounded"
              >
                Database
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
