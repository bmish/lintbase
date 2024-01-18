import {
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { prisma } from '@/server/db';
import React from 'react';
import { useRouter } from 'next/router';
import { fixAnyDatesInObject } from '@/utils/prisma';
import { packageToLinkUs } from '@/utils/dynamic-fields';
import { Prisma } from '@prisma/client';
import { format } from 'timeago.js';
import GetAppIcon from '@mui/icons-material/GetApp';
import millify from 'millify';
import Head from 'next/head';
import Footer from '@/components/Footer';
import DashboardNavigation from '@/components/Dashboard/DashboardNavigation';
import { Octokit } from 'octokit';
import { env } from '@/env.mjs';
import { getServerAuthSession } from '@/server/auth';
import { type GetServerSideProps } from 'next';
import { getNodeEcosystem } from '@/utils/normalize';

const include = {
  rules: true,
  configs: true,
  package: true,
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;
  const p = query?.p as string | undefined;
  const c = query?.c as string | undefined;

  const octokit = new Octokit({
    auth: env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });

  const session = await getServerAuthSession(context);
  if (!session) {
    return { props: {} };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: session.user.id,
    },
  });

  if (
    !user.checkedStarsAt ||
    Date.now() - user.checkedStarsAt.getTime() > 86_400_000 // Cache for 24 hours.
  ) {
    const reposStarred = await octokit.paginate(
      octokit.rest.activity.listReposStarredByAuthenticatedUser,
      {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
        per_page: 100,
      },
    );

    const nodeEcosystem = await getNodeEcosystem();

    const deleteStars = prisma.starredRepositories.deleteMany({
      where: {
        userId: user.id,
      },
    });
    const createStars = prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        checkedStarsAt: new Date(),
        stars: {
          create: reposStarred
            .filter((repo) => !repo.fork)
            .map((repo) => ({
              repository: {
                connectOrCreate: {
                  where: {
                    fullName: repo.full_name,
                  },
                  create: {
                    archived: repo.archived,
                    countForks: repo.forks,
                    countStargazers: repo.stargazers_count,
                    countWatchers: repo.subscribers_count,
                    defaultBranch: repo.default_branch,
                    description: repo.description,
                    disabled: repo.disabled,
                    fork: repo.fork,
                    fullName: repo.full_name,
                    githubCreatedAt: repo.created_at,
                    githubId: repo.id,
                    githubPushedAt: repo.pushed_at,
                    githubUpdatedAt: repo.updated_at,
                    language: repo.language,
                    name: repo.name,
                    private: repo.private,
                    size: repo.size,
                    urlClone: repo.clone_url,
                    urlGit: repo.git_url,
                    urlHomepage: repo.homepage,
                    urlHtml: repo.html_url,
                    urlSsh: repo.ssh_url,
                    visibility: repo.visibility,

                    package: {
                      connectOrCreate: {
                        where: {
                          name_ecosystemId: {
                            name: repo.name,
                            ecosystemId: nodeEcosystem.id,
                          },
                        },
                        create: {
                          name: repo.name,
                          ecosystemId: nodeEcosystem.id,
                        },
                      },
                    },
                  },
                },
              },
            })),
        },
      },
    });

    // Transaction so that we only delete stars if we can create them.
    await prisma.$transaction([deleteStars, createStars]);
  }

  const userWithStars = await prisma.user.findUniqueOrThrow({
    where: {
      id: session.user.id,
    },
    include: {
      stars: {
        include: {
          repository: true,
        },
      },
    },
  });

  // Access individual query parameters
  const currentPage = p ? Number(p) - 1 : 0;
  const pageSize = c ? Number(c) : 25;

  // Create where query.
  const actualLinter = {
    OR: [{ rules: { some: {} } }, { configs: { some: {} } }],
  };
  const starred = {
    OR: userWithStars.stars.map((stars) => ({
      package: {
        name: stars.repository.name, // TODO: need to get actual package name from repository.
      },
    })),
  };
  const where = { AND: [starred, actualLinter] };

  const [linterCount, linters] = await Promise.all([
    prisma.linter.count({
      where,
    }),
    prisma.linter.findMany({
      include,
      take: Number(pageSize),
      skip: Number(currentPage) * Number(pageSize),
      where,
      orderBy: {
        package: {
          countDownloadsThisWeek: Prisma.SortOrder.desc,
        },
      },
    }),
  ]);

  const lintersFixed = linters.map((linter) => fixAnyDatesInObject(linter));

  return {
    props: {
      data: { linters: lintersFixed, linterCount, currentPage, pageSize },
    },
  };
};

export default function Starred({
  data: { linters, linterCount, currentPage, pageSize },
}: {
  data: {
    linters: Prisma.LinterGetPayload<{ include: typeof include }>[];
    linterCount: number;
    currentPage: number;
    pageSize: number;
  };
}) {
  const router = useRouter();

  const handleChangePage = async (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    const newQueryParams = new URLSearchParams();
    if (router.query.c) {
      newQueryParams.append('c', String(router.query.c));
    }
    if (newPage > 0) {
      newQueryParams.append('p', String(newPage + 1));
    }
    await router.push(
      `${router.pathname}${
        newQueryParams.size > 0 ? '?' : ''
      }${newQueryParams.toString()}`,
    );
  };

  const handleChangeRowsPerPage = async (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const pageSize = Number.parseInt(event.target.value, 10);
    const newQueryParams = new URLSearchParams();
    newQueryParams.append('c', String(pageSize));

    await router.push(`${router.pathname}?${newQueryParams.toString()}`);
  };

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>Lintbase Dashboard - Starred</title>
        <meta
          property="og:title"
          content="Lintbase Dashboard - Starred"
          key="title"
        />
      </Head>
      <DashboardNavigation />
      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="linter list">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Name</TableCell>
                <TableCell scope="col" align="left">
                  Description
                </TableCell>
                <TableCell scope="col" align="right">
                  Rules
                </TableCell>
                <TableCell scope="col" align="right">
                  Configs
                </TableCell>
                <TableCell scope="col" align="right">
                  Wkly
                  <GetAppIcon fontSize="inherit" titleAccess="Downloads" />
                </TableCell>
                <TableCell scope="col" align="right">
                  Published
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {linters.map((linter) => (
                <TableRow
                  key={linter.package.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link
                      href={packageToLinkUs(linter.package)}
                      underline="none"
                    >
                      {linter.package.name}
                    </Link>
                  </TableCell>
                  <TableCell align="left">
                    {linter.package.description}
                  </TableCell>
                  <TableCell align="right">{linter.rules.length}</TableCell>
                  <TableCell align="right">{linter.configs.length}</TableCell>
                  <TableCell align="right">
                    {linter.package.countDownloadsThisWeek &&
                      millify(linter.package.countDownloadsThisWeek)}
                  </TableCell>
                  <TableCell align="right">
                    {linter.package.packageUpdatedAt && (
                      <time
                        dateTime={new Date(
                          linter.package.packageUpdatedAt,
                        ).toISOString()}
                        title={new Date(
                          linter.package.packageUpdatedAt,
                        ).toUTCString()}
                      >
                        {format(new Date(linter.package.packageUpdatedAt))}
                      </time>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50]}
                  count={linterCount}
                  page={currentPage}
                  rowsPerPage={pageSize}
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onPageChange={handleChangePage}
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>

        <Footer />
      </main>
    </div>
  );
}
