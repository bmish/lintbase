/* eslint n/no-unsupported-features/es-syntax:"off" */
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
  Tooltip,
  IconButton,
} from '@mui/material';
import Link from 'next/link';
import { type GetServerSideProps } from 'next';
import { prisma } from '@/server/db';
import { Prisma } from '@prisma/client';
import { fixAnyDatesInObject } from '@/utils/prisma';
import { getServerAuthSession } from '@/server/auth';
import { format } from 'timeago.js';
import { Info } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerAuthSession(context);
  if (!session) {
    return { props: {} };
  }

  const repositories = await prisma.repository.findMany({
    where: {
      owner: { id: session.user.id },
    },
    orderBy: {
      fullName: Prisma.SortOrder.asc,
    },
  });

  return {
    props: {
      data: {
        repositories: repositories.map((repo) => fixAnyDatesInObject(repo)),
      },
    },
  };
};

export default function Repos({
  data: { repositories },
}: {
  data: {
    repositories: Prisma.RepositoryGetPayload<Record<string, never>>[];
  };
}) {
  const { data: session } = useSession();

  if (!session) {
    return <AccessDenied />;
  }

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>Lintbase Dashboard - Repositories</title>
        <meta
          property="og:title"
          content="Lintbase Dashboard - Repositories"
          key="title"
        />
      </Head>
      <DatabaseNavigation />
      <main className="py-8 px-6 mx-auto min-h-screen">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="linter config list">
            <TableHead>
              <TableRow>
                <TableCell scope="col">
                  Repository{' '}
                  <Tooltip title="These are repositories you've imported for lint tracking and management.">
                    <IconButton>
                      <Info />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell scope="col">Imported</TableCell>
                <TableCell scope="col">Refreshed</TableCell>
                <TableCell align="right">
                  <Button variant="outlined" href="/dashboard/repos/add">
                    <AddIcon fontSize="small" className="mr-1" /> Add Repository
                  </Button>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {repositories.map((repo) => (
                <TableRow
                  key={repo.fullName}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link
                      href={`/dashboard/repos/${encodeURIComponent(
                        repo.fullName,
                      )}`}
                    >
                      {repo.fullName}
                    </Link>
                  </TableCell>
                  <TableCell scope="col">
                    {repo.importedAt && (
                      <div>{format(new Date(repo.importedAt))}</div>
                    )}
                  </TableCell>
                  <TableCell scope="col">
                    {repo.updatedAt && (
                      <div>{format(new Date(repo.updatedAt))}</div>
                    )}
                  </TableCell>
                  <TableCell scope="row" align="right"></TableCell>
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
