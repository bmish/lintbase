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
  Tooltip,
  IconButton,
} from '@mui/material';
import Link from 'next/link';
import { type GetServerSideProps } from 'next';
import { prisma } from '@/server/db';
import { Prisma } from '@prisma/client';
import { fixAnyDatesInObject } from '@/utils/normalize';
import { getServerAuthSession } from '@/server/auth';
import { api } from '@/utils/api';
import { format } from 'timeago.js';
import { Info } from '@mui/icons-material';

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
  const repositoryRefreshMutation = api.repository.refresh.useMutation();

  if (!session) {
    return <AccessDenied />;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // @ts-expect-error -- custom hidden element
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const repositoryFullName = e.currentTarget.elements.repositoryFullName
      .value as string;

    const repository = repositories.find(
      (repo) => repo.fullName === repositoryFullName
    );

    if (!repository) {
      return;
    }

    repositoryRefreshMutation.mutate({
      fullName: repository.fullName,
    });
  };

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
      <main className="py-8 px-6 mx-auto min-h-screen">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="linter config list">
            <TableHead>
              <TableRow>
                <TableCell scope="col">
                  Repository{' '}
                  <Tooltip title="These are repositories you've imported.">
                    <IconButton>
                      <Info />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell scope="col" align="right">
                  Refreshed
                </TableCell>
                <TableCell scope="col" align="right">
                  Last Commit
                </TableCell>
                <TableCell align="right">
                  <Button variant="outlined" href="/dashboard/repos/add">
                    Add Repository
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
                        repo.fullName
                      )}`}
                    >
                      {repo.fullName}
                    </Link>
                  </TableCell>
                  <TableCell scope="col" align="right">
                    {repo.updatedAt && (
                      <div>{format(new Date(repo.updatedAt).toString())} </div>
                    )}
                  </TableCell>
                  <TableCell scope="row" align="right">
                    {repo.commitSha && (
                      <span>
                        <Link
                          href={`https://github.com/${repo.fullName}/commit/${repo.commitSha}`}
                        >
                          <code>{repo.commitSha.slice(0, 7)}</code>
                        </Link>
                        {repo.committedAt &&
                          ` (${format(repo.committedAt.toString())})`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell scope="row" align="right">
                    <form onSubmit={handleSubmit}>
                      <Button type="submit" variant="outlined">
                        Refresh
                      </Button>
                      <input
                        type="hidden"
                        name="repositoryFullName"
                        value={repo.fullName}
                      />
                    </form>
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
