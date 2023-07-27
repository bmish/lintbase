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
import { App } from 'octokit';
import { type GetServerSideProps } from 'next';
import { env } from '@/env.mjs';

export const getServerSideProps: GetServerSideProps = async () => {
  const appId = 361_377; // https://github.com/settings/apps/lintbase
  const privateKey = env.GITHUB_PRIVATE_KEY;
  const app = new App({ appId, privateKey });

  const repos: { full_name: string }[] = [];

  for await (const { repository } of app.eachRepository.iterator()) {
    repos.push({ full_name: repository.full_name });
  }

  return { props: { data: { repositories: repos } } };
};

export default function Repos({
  data: { repositories },
}: {
  data: {
    repositories: { full_name: string }[];
  };
}) {
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
          href="https://github.com/apps/lintbase/installations/select_target"
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
              {repositories.map((repo) => (
                <TableRow
                  key={repo.full_name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link
                      href={`/dashboard/repos/${encodeURIComponent(
                        repo.full_name
                      )}`}
                    >
                      {repo.full_name}
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
