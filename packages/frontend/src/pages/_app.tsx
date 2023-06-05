/* eslint filenames/match-exported:"off" */
// eslint-disable-next-line import/no-unassigned-import
import '../styles/globals.css';

import type { AppProps } from 'next/app';
import { AppType } from 'next/dist/shared/lib/utils';
import { api } from '@/utils/api';

const App: AppType = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

export default api.withTRPC(App);
