/* eslint filenames/match-exported:"off" */
import '../styles/globals.css'; // eslint-disable-line import/no-unassigned-import

import '@fontsource/roboto/300.css'; // eslint-disable-line import/no-unassigned-import
import '@fontsource/roboto/400.css'; // eslint-disable-line import/no-unassigned-import
import '@fontsource/roboto/500.css'; // eslint-disable-line import/no-unassigned-import
import '@fontsource/roboto/700.css'; // eslint-disable-line import/no-unassigned-import

import type { AppType } from 'next/app';
import { api } from '@/utils/api';
import Layout from '../components/layout';
import { SessionProvider } from 'next-auth/react';
import { type Session } from 'next-auth';

const App: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
};

export default api.withTRPC(App);
