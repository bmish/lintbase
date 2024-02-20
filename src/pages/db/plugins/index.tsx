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
import DatabaseNavigation from '@/components/Database/DatabaseNavigation';
import Head from 'next/head';
import Footer from '@/components/Layout/Footer';

const include = {
  rules: true,
  configs: true,
  package: true,
};

export async function getServerSideProps({
  query,
}: {
  query: { q: string; p: string; c: string; keyword: string; linter: string };
}) {
  // Access individual query parameters
  const { q, p, c, keyword, linter } = query;
  const currentPage = p ? Number(p) - 1 : 0;
  const pageSize = c ? Number(c) : 25;

  const actualLinter = {
    OR: [{ rules: { some: {} } }, { configs: { some: {} } }],
  };
  const keywordQuery = keyword
    ? {
        package: {
          keywords: {
            some: {
              name: {
                equals: keyword,
              },
            },
          },
        },
      }
    : {};
  const linterQuery = linter
    ? {
        lintFramework: {
          name: {
            equals: linter,
          },
        },
      }
    : {};
  const qQuery = q
    ? {
        OR: [
          {
            package: {
              keywords: {
                some: {
                  name: {
                    contains: q,
                  },
                },
              },
            },
          },
          {
            package: {
              name: {
                contains: q,
              },
            },
          },
          {
            package: {
              description: {
                contains: q,
              },
            },
          },
        ],
      }
    : {};
  const where = {
    AND: [qQuery, actualLinter],
    ...keywordQuery,
    ...linterQuery,
  };

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
}

export default function Plugins({
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
    if (router.query.q) {
      newQueryParams.append('q', String(router.query.q));
    }
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
    if (router.query.q) {
      newQueryParams.append('q', String(router.query.q));
    }
    newQueryParams.append('c', String(pageSize));

    await router.push(`${router.pathname}?${newQueryParams.toString()}`);
  };

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>Lintbase Plugins</title>
        <meta property="og:title" content="Lintbase Plugins" key="title" />
      </Head>
      <DatabaseNavigation />
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
                  rowsPerPageOptions={[25]}
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