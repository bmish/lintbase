/* eslint filenames/match-exported:"off" */
import '../styles/globals.css'; // eslint-disable-line import/no-unassigned-import

import '@fontsource/roboto/300.css'; // eslint-disable-line import/no-unassigned-import
import '@fontsource/roboto/400.css'; // eslint-disable-line import/no-unassigned-import
import '@fontsource/roboto/500.css'; // eslint-disable-line import/no-unassigned-import
import '@fontsource/roboto/700.css'; // eslint-disable-line import/no-unassigned-import

import type { AppProps } from 'next/app';
import { AppType } from 'next/dist/shared/lib/utils';
import { api } from '@/utils/api';
import Layout from '../components/layout';

const App: AppType = ({ Component, pageProps }: AppProps) => {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
};

export default api.withTRPC(App);
