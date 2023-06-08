import Header from '@/components/Header';
import { Plugin } from '@/types';
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
import { fixPlugin } from '@/utils';

export async function getServerSideProps(context: {
  query: { q: string; p: string; c: string };
}) {
  const { query } = context;

  // Access individual query parameters
  const { q, p, c } = query;
  const currentPage = p ? Number(p) - 1 : 0;
  const pageSize = c ? Number(c) : 25;

  const pluginCount = await prisma.plugin.count({
    where: q
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
        }
      : {},
  });

  const plugins = await prisma.plugin.findMany({
    include: {
      rules: true,
      configs: true,
    },
    take: pageSize === -1 ? undefined : Number(pageSize),
    skip: pageSize === -1 ? 0 : Number(currentPage) * Number(pageSize),
    where: q
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
        }
      : {},
  });
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
    plugins: Plugin[];
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
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 mx-auto">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
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
                    <Link
                      href={`/npm/${encodeURIComponent(plugin.name)}`}
                      underline="none"
                    >
                      {plugin.name}
                    </Link>
                  </TableCell>
                  <TableCell align="left">{plugin.description}</TableCell>
                  <TableCell align="right">{plugin.rules.length}</TableCell>
                  <TableCell align="right">{plugin.countStars}</TableCell>
                  <TableCell align="right">
                    {new Date(plugin.updatedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[
                    5,
                    10,
                    25,
                    50,
                    { label: 'All', value: -1 },
                  ]}
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
