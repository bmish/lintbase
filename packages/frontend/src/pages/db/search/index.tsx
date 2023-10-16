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
import { packageToLinkUs, ruleToLinkUs } from '@/utils/dynamic-fields';
import { Prisma } from '@prisma/client';
import { format } from 'timeago.js';
import GetAppIcon from '@mui/icons-material/GetApp';
import millify from 'millify';
import DatabaseNavigation from '@/components/DatabaseNavigation';
import Head from 'next/head';
import Footer from '@/components/Footer';
import EmojiFixable from '@/components/EmojiFixable';
import EmojiHasSuggestions from '@/components/EmojiHasSuggestions';
import EmojiRequiresTypeChecking from '@/components/EmojiRequiresTypeChecking';
import EmojiTypeLayout from '@/components/EmojiTypeLayout';
import EmojiTypeProblem from '@/components/EmojiTypeProblem';
import EmojiTypeSuggestion from '@/components/EmojiTypeSuggestion';
import EmojiOptions from '@/components/EmojiOptions';
import EmojiDeprecated from '@/components/EmojiDeprecated';
import EmojiType from '@/components/EmojiType';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';

const includeLinter = {
  rules: true,
  configs: true,
  package: true,
};

const includeRule = {
  linter: {
    include: {
      package: true,
    },
  },
  options: true,
};

export async function getServerSideProps({
  query,
}: {
  query: {
    q?: string;
    pPlugin?: string;
    pRule?: string;
    c?: string;
  };
}) {
  // Access individual query parameters
  const { q, pPlugin, pRule, c } = query;
  const currentPagePlugin = pPlugin ? Number(pPlugin) - 1 : 0;
  const currentPageRule = pRule ? Number(pRule) - 1 : 0;
  const pageSize = c ? Number(c) : 10;

  const actualLinter = {
    OR: [{ rules: { some: {} } }, { configs: { some: {} } }],
  };
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
          {
            lintees: {
              some: {
                name: {
                  contains: q,
                },
              },
            },
          },
        ],
      }
    : {};
  const whereLinter = {
    AND: [qQuery, actualLinter],
  };

  const whereRule = q
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
    : {};

  const [linterCount, linters, ruleCount, rules] = await Promise.all([
    prisma.linter.count({
      where: whereLinter,
    }),
    prisma.linter.findMany({
      include: includeLinter,
      take: Number(pageSize),
      skip: Number(currentPagePlugin) * Number(pageSize),
      where: whereLinter,
      orderBy: {
        package: {
          countWeeklyDownloads: Prisma.SortOrder.desc,
        },
      },
    }),
    prisma.rule.count({
      where: whereRule,
    }),
    prisma.rule.findMany({
      include: includeRule,
      take: Number(pageSize),
      skip: Number(currentPageRule) * Number(pageSize),
      where: whereRule,
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
    }),
  ]);

  const lintersFixed = linters.map((linter) => fixAnyDatesInObject(linter));
  const rulesFixed = rules.map((rule) => fixAnyDatesInObject(rule));

  return {
    props: {
      data: {
        linters: lintersFixed,
        linterCount,
        rules: rulesFixed,
        ruleCount,
        currentPagePlugin,
        currentPageRule,
        pageSize,
      },
    },
  };
}

export default function Search({
  data: {
    linters,
    linterCount,
    rules,
    ruleCount,
    currentPagePlugin,
    currentPageRule,
    pageSize,
  },
}: {
  data: {
    linters: Prisma.LinterGetPayload<{ include: typeof includeLinter }>[];
    linterCount: number;
    rules: Prisma.RuleGetPayload<{ include: typeof includeRule }>[];
    ruleCount: number;
    currentPagePlugin: number;
    currentPageRule: number;
    pageSize: number;
  };
}) {
  const router = useRouter();

  async function handleChangePage(
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
    type: 'plugin' | 'rule'
  ) {
    const newQueryParams = new URLSearchParams();
    if (router.query.q) {
      newQueryParams.append('q', String(router.query.q));
    }
    if (type === 'plugin') {
      if (router.query.pRule) {
        newQueryParams.append('pRule', String(router.query.pRule));
      }
      if (newPage > 0) {
        newQueryParams.append('pPlugin', String(newPage + 1));
      }
    } else if (type === 'rule') {
      if (router.query.pPlugin) {
        newQueryParams.append('pPlugin', String(router.query.pPlugin));
      }
      if (newPage > 0) {
        newQueryParams.append('pRule', String(newPage + 1));
      }
    }

    await router.push(
      `${router.pathname}${
        newQueryParams.size > 0 ? '?' : ''
      }${newQueryParams.toString()}`
    );
  }

  async function handleChangePagePlugin(
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) {
    await handleChangePage(event, newPage, 'plugin');
  }

  async function handleChangePageRule(
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) {
    await handleChangePage(event, newPage, 'rule');
  }

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
                <TableCell scope="col">Plugin</TableCell>
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
                    {millify(linter.package.countWeeklyDownloads)}
                  </TableCell>
                  <TableCell align="right">
                    <time
                      dateTime={new Date(
                        linter.package.packageUpdatedAt
                      ).toISOString()}
                      title={new Date(
                        linter.package.packageUpdatedAt
                      ).toUTCString()}
                    >
                      {format(new Date(linter.package.packageUpdatedAt))}
                    </time>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[10]}
                  count={linterCount}
                  page={currentPagePlugin}
                  rowsPerPage={pageSize}
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onPageChange={handleChangePagePlugin}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>

        <TableContainer component={Paper} className="mt-8">
          <Table sx={{ minWidth: 650 }} aria-label="rule list">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Rule</TableCell>
                <TableCell scope="col" align="left">
                  Description
                </TableCell>
                <TableCell scope="col" align="right" title="Fixable">
                  <EmojiFixable />
                </TableCell>
                <TableCell scope="col" align="right">
                  <EmojiHasSuggestions />
                </TableCell>
                <TableCell scope="col" align="right">
                  <EmojiRequiresTypeChecking />
                </TableCell>
                <TableCell scope="col" align="right">
                  <EmojiType />
                </TableCell>
                <TableCell scope="col" align="right">
                  <EmojiOptions />
                </TableCell>
                <TableCell scope="col" align="right">
                  <EmojiDeprecated />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow
                  key={`${rule.linter.package.name}/${rule.name}`}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link
                      href={ruleToLinkUs(rule, rule.linter.package)}
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
                    {rule.fixable ? <EmojiFixable /> : ''}
                  </TableCell>
                  <TableCell align="right">
                    {rule.hasSuggestions ? <EmojiHasSuggestions /> : ''}
                  </TableCell>
                  <TableCell align="right">
                    {rule.requiresTypeChecking ? (
                      <EmojiRequiresTypeChecking />
                    ) : (
                      ''
                    )}
                  </TableCell>

                  <TableCell align="right">
                    {rule.type === 'layout' ? <EmojiTypeLayout /> : ''}
                    {rule.type === 'problem' ? <EmojiTypeProblem /> : ''}
                    {rule.type === 'suggestion' ? <EmojiTypeSuggestion /> : ''}
                  </TableCell>
                  <TableCell align="right">
                    {rule.options.length > 0 ? <EmojiOptions /> : ''}
                  </TableCell>
                  <TableCell align="right">
                    {rule.deprecated ? <EmojiDeprecated /> : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[10]}
                  count={ruleCount}
                  page={currentPageRule}
                  rowsPerPage={pageSize}
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onPageChange={handleChangePageRule}
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
