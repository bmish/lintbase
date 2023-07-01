import { TextField } from '@mui/material';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Header() {
  const router = useRouter();

  const [searchValue, setSearchValue] = useState(router.query.q || '');

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);

    const SEARCHABLE_PATHS = ['/db/plugins', '/db/rules'];

    const newUrl = SEARCHABLE_PATHS.includes(router.pathname)
      ? router.pathname
      : '/db/plugins';

    await (event.target.value
      ? router.push(`${newUrl}?q=${event.target.value}`)
      : router.push(newUrl));
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
      <div className="flex items-center justify-between mx-auto max-w-7xl space-x-2">
        <Link href="/">
          <Image src={'/logo.png'} width={200} height={55} alt="Logo" />
        </Link>

        <ul className="space-x-0 sm:space-x-2 inline-flex">
          <li>
            <TextField
              type="search"
              placeholder="Search"
              variant="standard"
              value={searchValue}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onChange={handleChange} // TODO: add debouncing
            ></TextField>
          </li>
          <li>
            <Link
              href="/db"
              className="px-2 sm:px-4 py-2 font-semibold text-gray-600 rounded hidden sm:inline"
            >
              Database
            </Link>
            <Link
              href="/db"
              className="px-2 sm:px-4 py-2 font-semibold text-gray-600 rounded sm:hidden"
            >
              DB
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className="px-2 sm:px-4 py-2 font-semibold text-gray-600 rounded"
            >
              About
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
