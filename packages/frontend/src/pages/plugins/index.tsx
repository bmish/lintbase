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
import { fixPlugin } from '@/utils/normalize';
import { pluginToLinkUs } from '@/utils/dynamic-fields';
import { Prisma } from '@prisma/client';

const include = {
  rules: true,
};

export async function getServerSideProps({
  query,
}: {
  query: { q: string; p: string; c: string; keyword: string };
}) {
  // Access individual query parameters
  const { q, p, c, keyword } = query;
  const currentPage = p ? Number(p) - 1 : 0;
  const pageSize = c ? Number(c) : 25;

  const keywordQuery = keyword
    ? {
        keywords: {
          some: {
            name: {
              equals: keyword,
            },
          },
        },
      }
    : {};
  const where = q
    ? {
        OR: [
          {
            name: {
              contains: q,
            },
          },
          {
            description: {
              contains: q,
            },
          },
        ],
        ...keywordQuery,
      }
    : { ...keywordQuery };

  const [pluginCount, plugins] = await Promise.all([
    prisma.plugin.count({
      where,
    }),
    prisma.plugin.findMany({
      include,
      take: Number(pageSize),
      skip: Number(currentPage) * Number(pageSize),
      where,
    }),
  ]);

  const pluginsFixed = await plugins.map((plugin) => fixPlugin(plugin));

  return {
    props: {
      data: { plugins: pluginsFixed, pluginCount, currentPage, pageSize },
    },
  };
}

export default function Plugins({
  data: { plugins, pluginCount, currentPage, pageSize },
}: {
  data: {
    plugins: Prisma.PluginGetPayload<{ include: typeof include }>[];
    pluginCount: number;
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
      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 mx-auto min-h-screen">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="plugin list">
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
                  Stars
                </TableCell>
                <TableCell scope="col" align="right">
                  Last Published
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plugins.map((plugin) => (
                <TableRow
                  key={plugin.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link href={pluginToLinkUs(plugin)} underline="none">
                      {plugin.name}
                    </Link>
                  </TableCell>
                  <TableCell align="left">{plugin.description}</TableCell>
                  <TableCell align="right">{plugin.rules.length}</TableCell>
                  <TableCell align="right">{plugin.countStars}</TableCell>
                  <TableCell align="right">
                    {new Date(plugin.packageUpdatedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  count={pluginCount}
                  page={currentPage}
                  rowsPerPage={pageSize}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </main>
    </div>
  );
}
