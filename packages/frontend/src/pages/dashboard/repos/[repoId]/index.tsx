/* eslint filenames/match-exported:"off" */
/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import {
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import AccessDenied from '@/components/AccessDenied';
import DatabaseNavigation from '@/components/DashboardNavigation';
import { getServerAuthSession } from '@/server/auth';
import { type GetServerSideProps } from 'next';
import React from 'react';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { fixAnyDatesInObject } from '@/utils/normalize';
import { format } from 'timeago.js';
import { lintFrameworkToDisplayName } from '@/utils/dynamic-fields';

const include = {
  localPackages: {
    include: {
      localPackageLintFrameworks: { include: { lintFramework: true } },
    },
  },
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const repoId = params?.repoId as string;

  const session = await getServerAuthSession(context);
  if (!session) {
    return { props: {} };
  }

  const repo = await prisma.repository.findFirstOrThrow({
    where: {
      fullName: repoId,
      owner: { id: session?.user.id },
    },
    include,
  });
  const repoFixed = fixAnyDatesInObject(repo);

  return { props: { data: { repo: repoFixed } } };
};

export default function Repo({
  data: { repo },
}: {
  data: { repo: Prisma.RepositoryGetPayload<{ include: typeof include }> };
}) {
  const { data: session } = useSession();

  if (!session) {
    return <AccessDenied />;
  }

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase Dashboard Repository - {repo.fullName}</title>
        <meta
          property="og:title"
          content={`LintBase Dashboard Repository - ${repo.fullName}`}
          key="title"
        />
      </Head>
      <DatabaseNavigation />

      <main className="py-8 px-6 mx-auto min-h-screen">
        <Card>
          <CardContent>
            <Breadcrumbs aria-label="breadcrumb" className="mb-1">
              <Typography variant="h5">
                <Link href={'/dashboard/repos'}>Repositories</Link>
              </Typography>
              <Typography variant="h5">{repo.fullName}</Typography>
            </Breadcrumbs>
            <br />
            <p>{repo.description}</p>
            <br />
            <p>
              Imported:{' '}
              {repo.importedAt && (
                <span>{format(new Date(repo.importedAt).toString())} </span>
              )}
            </p>
            <p>
              Refreshed:{' '}
              {repo.scannedAt && (
                <span>{format(new Date(repo.scannedAt).toString())} </span>
              )}
            </p>
            <p>
              {repo.commitSha && (
                <span>
                  Last Commit:{' '}
                  <Link
                    href={`https://github.com/${repo.fullName}/commit/${repo.commitSha}`}
                  >
                    <code>{repo.commitSha.slice(0, 7)}</code>
                  </Link>
                  {repo.committedAt &&
                    ` (${format(repo.committedAt.toString())})`}
                </span>
              )}
            </p>
          </CardContent>
          <CardActions>
            <Button href={`https://github.com/${repo.fullName}`}>GitHub</Button>
          </CardActions>
        </Card>

        {repo.localPackages.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table aria-label="linter config list">
              {repo.localPackages.map((localPackage) => (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell scope="col">(Repository Root)</TableCell>
                      <TableCell align="right">
                        <Link
                          key={localPackage.id}
                          href={`https://github.com/${repo.fullName}/blob/${
                            repo.commitSha as string
                          }/${localPackage.path}`}
                        >
                          <code>
                            {localPackage.path === '.'
                              ? '/'
                              : localPackage.path}
                          </code>
                        </Link>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localPackage.localPackageLintFrameworks.map(
                      (localPackageLintFramework) => (
                        <TableRow key={localPackageLintFramework.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/repos/${encodeURIComponent(
                                repo.fullName
                              )}/packages/${
                                localPackage.path === '.'
                                  ? 'root'
                                  : localPackage.path
                              }/linters/${
                                localPackageLintFramework.lintFramework.name
                              }`}
                            >
                              {' '}
                              {lintFrameworkToDisplayName(
                                localPackageLintFramework.lintFramework
                              )}
                            </Link>
                          </TableCell>
                          <TableCell align="right"></TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </>
              ))}
            </Table>
          </TableContainer>
        )}

        <Footer />
      </main>
    </div>
  );
}
