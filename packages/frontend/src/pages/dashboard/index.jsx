/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import { Paper } from '@mui/material';
import { useSession } from 'next-auth/react';
import AccessDenied from '@/components/AccessDenied';

export default function Dashboard() {
  const { data: session } = useSession();

  if (!session) {
    return <AccessDenied />;
  }

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase Dashboard</title>
        <meta property="og:title" content="LintBase Dashboard" key="title" />
      </Head>
      <main className="py-8 px-6 max-w-4xl mx-auto min-h-screen">
        <Paper className="p-8">
          <p>Coming soon.</p>
        </Paper>
        <Footer />
      </main>
    </div>
  );
}
