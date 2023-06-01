/* eslint filenames/match-exported:"off" */
// eslint-disable-next-line import/no-unassigned-import
import '../styles/globals.css';

import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}