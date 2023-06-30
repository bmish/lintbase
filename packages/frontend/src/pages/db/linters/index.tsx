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
import { fixAnyDatesInObject } from '@/utils/normalize';
import {
  ecosystemToDisplayName,
  lintFrameworkToLinkUs,
} from '@/utils/dynamic-fields';
import { Prisma } from '@prisma/client';
import DatabaseNavigation from '@/components/DatabaseNavigation';
import Head from 'next/head';
import Footer from '@/components/Footer';
import GetAppIcon from '@mui/icons-material/GetApp';
import { format } from 'timeago.js';
import millify from 'millify';

const include = {
  _count: {
    select: { linters: true },
  },
  linter: { include: { package: true } },
  ecosystem: true,
};

export async function getServerSideProps({
  query,
}: {
  query: { q: string; p: string; c: string; keyword: string; linter: string };
}) {
  // Access individual query parameters
  const { q, p, c } = query;
  const currentPage = p ? Number(p) - 1 : 0;
  const pageSize = c ? Number(c) : 25;

  const where = q
    ? {
        OR: [
          {
            name: {
              contains: q,
            },
          },
        ],
      }
    : {};

  const [lintFrameworkCount, lintFrameworks] = await Promise.all([
    prisma.lintFramework.count({
      where,
    }),
    prisma.lintFramework.findMany({
      take: Number(pageSize),
      skip: Number(currentPage) * Number(pageSize),
      where,
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
      include,
    }),
  ]);

  const lintFrameworksFixed = await lintFrameworks.map((linter) =>
    fixAnyDatesInObject(linter)
  );

  return {
    props: {
      data: {
        lintFrameworks: lintFrameworksFixed,
        lintFrameworkCount,
        currentPage,
        pageSize,
      },
    },
  };
}

export default function Linters({
  data: { lintFrameworks, lintFrameworkCount, currentPage, pageSize },
}: {
  data: {
    lintFrameworks: Prisma.LintFrameworkGetPayload<{
      include: typeof include;
    }>[];
    lintFrameworkCount: number;
    currentPage: number;
    pageSize: number;
  };
}) {
  const router = useRouter();

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
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
    router.push(
      `${router.pathname}${
        newQueryParams.size > 0 ? '?' : ''
      }${newQueryParams.toString()}`
    );
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const pageSize = Number.parseInt(event.target.value, 10);
    const newQueryParams = new URLSearchParams();
    if (router.query.q) {
      newQueryParams.append('q', String(router.query.q));
    }
    newQueryParams.append('c', String(pageSize));

    router.push(`${router.pathname}?${newQueryParams.toString()}`);
  };

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase Linters</title>
        <meta property="og:title" content="LintBase Linters" key="title" />
      </Head>
      <DatabaseNavigation />
      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="linter list">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Name</TableCell>
                <TableCell scope="col">Description</TableCell>
                <TableCell scope="col" align="right">
                  Ecosystem
                </TableCell>
                <TableCell scope="col" align="right">
                  Plugins
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
              {lintFrameworks.map((lintFramework) => (
                <TableRow
                  key={lintFramework.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link
                      href={lintFrameworkToLinkUs(lintFramework)}
                      underline="none"
                    >
                      {lintFramework.name}
                    </Link>
                  </TableCell>

                  <TableCell scope="row">
                    {lintFramework.linter?.package.description}
                  </TableCell>
                  <TableCell scope="row" align="right">
                    {ecosystemToDisplayName(lintFramework.ecosystem)}
                  </TableCell>
                  <TableCell scope="row" align="right">
                    {lintFramework._count.linters}
                  </TableCell>
                  <TableCell scope="row" align="right">
                    {lintFramework.linter &&
                      millify(
                        lintFramework.linter.package.countWeeklyDownloads
                      )}
                  </TableCell>
                  <TableCell align="right">
                    {lintFramework.linter && (
                      <time
                        dateTime={new Date(
                          lintFramework.linter.package.packageUpdatedAt
                        ).toISOString()}
                        title={new Date(
                          lintFramework.linter.package.packageUpdatedAt
                        ).toUTCString()}
                      >
                        {format(
                          new Date(
                            lintFramework.linter.package.packageUpdatedAt
                          )
                        )}
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
                  count={lintFrameworkCount}
                  page={currentPage}
                  rowsPerPage={pageSize}
                  onPageChange={handleChangePage}
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
