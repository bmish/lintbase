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
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
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
import { fixAnyDatesInObject } from '@/utils/prisma';
import { format } from 'timeago.js';
import { lintFrameworkToDisplayName } from '@/utils/dynamic-fields';
import { api } from '@/utils/api';
import { Info } from '@mui/icons-material';
import { Octokit } from 'octokit';
import { env } from '@/env.mjs';
import { useRouter } from 'next/router';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import Image from 'next/image';

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

  const octokit = new Octokit({
    auth: env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });

  let commits;
  try {
    commits = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner: repo.fullName.split('/')[0],
      repo: repo.name,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  } catch (error) {
    console.log('Unable to fetch commits from GitHub:', error); // eslint-disable-line no-console
  }
  const lastCommit = commits ? commits.data[0] : null;
  const countCommitsBehind = commits
    ? commits.data.findIndex((commit) => commit.sha === repo.commitSha)
    : null;

  return {
    props: { data: { repo: repoFixed, lastCommit, countCommitsBehind } },
  };
};

export default function Repo({
  data: { repo, lastCommit, countCommitsBehind },
}: {
  data: {
    repo: Prisma.RepositoryGetPayload<{ include: typeof include }>;
    lastCommit: { sha: string; commit: { committer: { date: string } } } | null;
    countCommitsBehind: number | null;
  };
}) {
  const { data: session } = useSession();
  const router = useRouter();

  const repositoryRefreshMutation = api.repository.refresh.useMutation();
  const repositoryRemoveMutation = api.repository.remove.useMutation();

  if (!session) {
    return <AccessDenied />;
  }

  const handleRefresh = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await repositoryRefreshMutation.mutateAsync({
      fullName: repo.fullName,
    });
  };

  const handleRemove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await repositoryRemoveMutation.mutateAsync({
      fullName: repo.fullName,
    });

    await router.push('/dashboard/repos');
  };

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>Lintbase Dashboard - {repo.fullName}</title>
        <meta
          property="og:title"
          content={`Lintbase Dashboard - ${repo.fullName}`}
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
          </CardContent>
          <CardActions>
            <Button href={`https://github.com/${repo.fullName}`}>
              <Image
                src="/icon-github.svg"
                width="12"
                height="12"
                alt="GitHub Logo"
                className="mr-1"
              />{' '}
              GitHub
            </Button>
          </CardActions>
        </Card>

        <Paper className="mt-8">
          <TableContainer className="border-none">
            <Table aria-label="stats">
              <TableBody>
                <TableRow>
                  <TableCell scope="row">First Imported</TableCell>
                  <TableCell>
                    {repo.importedAt && format(new Date(repo.importedAt))}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell align="right">
                    {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
                    <form onSubmit={handleRemove}>
                      <Button type="submit" variant="outlined" color="error">
                        <DeleteIcon fontSize="small" className="mr-1" /> Remove
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">Last Refreshed</TableCell>
                  <TableCell>
                    {repo.scannedAt && format(new Date(repo.scannedAt))}
                  </TableCell>
                  <TableCell>
                    {repo.commitSha && (
                      <Link
                        href={`https://github.com/${repo.fullName}/commit/${repo.commitSha}`}
                      >
                        <code>{repo.commitSha.slice(0, 7)}</code>
                      </Link>
                    )}
                    {repo.committedAt && ` (${format(repo.committedAt)})`}
                  </TableCell>
                  <TableCell align="right">
                    {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
                    <form onSubmit={handleRefresh}>
                      {countCommitsBehind === 0 && (
                        <Chip
                          color="success"
                          label="Up-to-date"
                          className="mr-4"
                        ></Chip>
                      )}
                      {countCommitsBehind === null && (
                        <Chip
                          color="warning"
                          label="Unable to Verify Latest Commit"
                          className="mr-4"
                        ></Chip>
                      )}
                      <Button
                        type="submit"
                        variant="outlined"
                        disabled={countCommitsBehind === 0}
                      >
                        <RefreshIcon fontSize="small" className="mr-1" />{' '}
                        Refresh
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
                {typeof countCommitsBehind === 'number' &&
                  countCommitsBehind > 0 && (
                    <TableRow>
                      <TableCell scope="row">Most Recent Commit</TableCell>
                      <TableCell></TableCell>
                      <TableCell>
                        {lastCommit && (
                          <Link
                            href={`https://github.com/${repo.fullName}/commit/${lastCommit.sha}`}
                          >
                            <code>{lastCommit.sha.slice(0, 7)}</code>
                          </Link>
                        )}
                        {lastCommit &&
                          ` (${format(
                            new Date(lastCommit.commit.committer.date)
                          )})`}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          color="warning"
                          label={`${countCommitsBehind} Commit${
                            countCommitsBehind === 1 ? '' : 's'
                          } Behind`}
                        ></Chip>
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {repo.localPackages.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table aria-label="linter config list">
              {repo.localPackages.map((localPackage) => (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell scope="col">
                        Repository Root{' '}
                        <Tooltip title="Currently, only ESLint in the repository root is detected. Support for monorepos and other linters will come later.">
                          <IconButton>
                            <Info />
                          </IconButton>
                        </Tooltip>
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
                              className="flex flex-row"
                            >
                              {localPackageLintFramework.lintFramework.name ===
                                'eslint' && (
                                <Image
                                  src="/icon-eslint-square.png"
                                  width="14"
                                  height="14"
                                  alt="ESLint Logo"
                                  className="mr-1 mt-1 mb-1"
                                />
                              )}
                              {lintFrameworkToDisplayName(
                                localPackageLintFramework.lintFramework
                              )}
                            </Link>
                          </TableCell>
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
