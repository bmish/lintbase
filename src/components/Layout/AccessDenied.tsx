import { Paper } from '@mui/material';
import Footer from './Footer';
import Link from 'next/link';

export default function AccessDenied() {
  return (
    <main className="py-8 px-6 max-w-4xl mx-auto min-h-screen">
      <Paper className="p-8">
        <p>
          Please <Link href="/api/auth/signin">login</Link> to view this page.
        </p>
      </Paper>
      <Footer />
    </main>
  );
}
