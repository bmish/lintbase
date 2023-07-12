/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import { Paper } from '@mui/material';
import { useSession } from 'next-auth/react';
import AccessDenied from '@/components/AccessDenied';
import Link from 'next/link';

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
          <p>Welcome, {session.user.name}.</p>
          <br></br>
          <p>Coming soon.</p>
          <br></br>
          <p>
            <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfc5yLA4DVIYsNAQVc-I-0By0fizM1gxJ96YjP23oVHg7Ku5A/viewform">
              Sign up
            </Link>{' '}
            for announcements.
          </p>
        </Paper>
        <Footer />
      </main>
    </div>
  );
}
