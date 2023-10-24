/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import { Paper } from '@mui/material';
import { useSession } from 'next-auth/react';
import AccessDenied from '@/components/AccessDenied';
import Link from 'next/link';
import DatabaseNavigation from '@/components/DashboardNavigation';

export default function Dashboard() {
  const { data: session } = useSession();

  if (!session) {
    return <AccessDenied />;
  }

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>Lintbase Dashboard</title>
        <meta property="og:title" content="Lintbase Dashboard" key="title" />
      </Head>
      <DatabaseNavigation />
      <main className="py-8 px-6 mx-auto min-h-screen">
        <Paper className="p-8">
          <p>Welcome, {session.user.name}.</p>
          <br></br>
          <p>
            View your <Link href="/dashboard/repos">repositories</Link>.
          </p>
        </Paper>
        <Footer />
      </main>
    </div>
  );
}
