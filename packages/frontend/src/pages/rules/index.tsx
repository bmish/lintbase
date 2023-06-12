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
import { fixRule } from '@/utils/normalize';
import React from 'react';
import { useRouter } from 'next/router';
import { ruleToLinkUs } from '@/utils/dynamic-fields';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { Prisma } from '@prisma/client';

const include = {
  plugin: true,
  options: true,
};

export async function getServerSideProps({
  query,
}: {
  query: { q: string; p: string; c: string; category: string };
}) {
  // Access individual query parameters
  const { q, p, c, category } = query;
  const currentPage = p ? Number(p) - 1 : 0;
  const pageSize = c ? Number(c) : 25;

  const categoryQuery = category ? { category } : {};
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
        ...categoryQuery,
      }
    : { ...categoryQuery };

  const [ruleCount, rules] = await Promise.all([
    prisma.rule.count({
      where,
    }),
    prisma.rule.findMany({
      include,
      take: Number(pageSize),
      skip: Number(currentPage) * Number(pageSize),
      where,
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  const rulesFixed = await rules.map((rule) => fixRule(rule));

  return {
    props: { data: { rules: rulesFixed, ruleCount, currentPage, pageSize } },
  };
}

export default function Rules({
  data: { rules, ruleCount, currentPage, pageSize },
}: {
  data: {
    rules: Prisma.RuleGetPayload<{ include: typeof include }>[];
    ruleCount: number;
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
          <Table sx={{ minWidth: 650 }} aria-label="rule list">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Name</TableCell>
                <TableCell scope="col" align="left">
                  Description
                </TableCell>
                <TableCell scope="col" align="right">
                  🔧
                </TableCell>
                <TableCell scope="col" align="right">
                  💡
                </TableCell>
                <TableCell scope="col" align="right">
                  💭
                </TableCell>
                <TableCell scope="col" align="right">
                  🗂️
                </TableCell>
                <TableCell scope="col" align="right">
                  ⚙️
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow
                  key={`${rule.plugin.name}/${rule.name}`}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link
                      href={ruleToLinkUs(rule, rule.plugin)}
                      underline="none"
                    >
                      {rule.name}
                    </Link>
                  </TableCell>
                  <TableCell align="left">
                    {rule.description && (
                      // eslint-disable-next-line react/no-children-prop -- false positive
                      <ReactMarkdown children={rule.description} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {rule.fixable ? '🔧' : ''}
                  </TableCell>
                  <TableCell align="right">
                    {rule.hasSuggestions ? '💡' : ''}
                  </TableCell>
                  <TableCell align="right">
                    {rule.requiresTypeChecking ? '💭' : ''}
                  </TableCell>

                  <TableCell align="right">
                    {rule.type === 'layout' ? '📏' : ''}
                    {rule.type === 'problem' ? '❗' : ''}
                    {rule.type === 'suggestion' ? '📖' : ''}
                  </TableCell>
                  <TableCell align="right">
                    {rule.options.length > 0 ? '⚙️' : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  count={ruleCount}
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
