/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import AccessDenied from '@/components/AccessDenied';
import DatabaseNavigation from '@/components/DashboardNavigation';
import {
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import Link from 'next/link';

export default function Repos() {
  const { data: session } = useSession();

  if (!session) {
    return <AccessDenied />;
  }

  const repos = [
    { name: 'dashboard' },
    { name: 'invoices' },
    { name: 'appointments' },
  ];

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
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="linter config list">
            <TableHead>
              <TableRow>
                <TableCell scope="col" colSpan={2}>
                  Repository
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {repos.map((repo) => (
                <TableRow
                  key={repo.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link href={`/dashboard/repos/${repo.name}`}>
                      {repo.name}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Footer />
      </main>
    </div>
  );
}
