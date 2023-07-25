/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import { Button, Paper } from '@mui/material';
import { useSession } from 'next-auth/react';
import AccessDenied from '@/components/AccessDenied';
import Link from 'next/link';
import DatabaseNavigation from '@/components/DashboardNavigation';

export default function Repos() {
  const { data: session } = useSession();

  if (!session) {
    return <AccessDenied />;
  }

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase Dashboard Repositories</title>
        <meta
          property="og:title"
          content="LintBase Dashboard Repositories"
          key="title"
        />
      </Head>
      <DatabaseNavigation />
      <div className=" px-6 pt-8 w-full flex flex-row  justify-end">
        <Button
          variant="contained"
          style={{
            'background-color':
              '#1976d2' /* Color is to avoid this issue https://stackoverflow.com/questions/75202373/button-in-material-ui-is-transparent-when-loading */,
          }}
        >
          Import Repository
        </Button>
      </div>
      <main className="py-8 px-6 mx-auto min-h-screen">
        <Paper className="p-8">
          <p>Coming soon.</p>
          <br></br>
        </Paper>
        <Footer />
      </main>
    </div>
  );
}
