/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import Head from 'next/head';
import Header from './Header';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <title>Lintbase</title>
        <meta property="og:title" content="Lintbase" key="title" />
        <meta
          name="description"
          property="og:description"
          content="npm for linters. Discover thousands of lint plugins and rules."
        />
        <meta property="og:image" content="/logo-1200x630-centered.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="Lintbase" />
      </Head>
      <Header />
      <main>{children}</main>
    </>
  );
}
