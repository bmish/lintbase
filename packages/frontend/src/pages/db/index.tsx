import DatabaseNavigation from '@/components/DatabaseNavigation';
import LinterCard from '@/components/LinterCard';
import { prisma } from '@/server/db';
import { fixAnyDatesInObject } from '@/utils/normalize';
import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '@/components/Footer';

const includeLinters = {
  rules: true,
  configs: true,
  package: {
    include: {
      ecosystem: true,
      keywords: true,
    },
  },
  lintFramework: true,
};

const actualLinter = {
  OR: [{ rules: { some: {} } }, { configs: { some: {} } }], // Actual linter with rules or configs.
};

export async function getServerSideProps() {
  const [
    lintersPopular,
    lintersRecentlyUpdated,
    commonLinterKeywords,
    commonRuleCategories,
  ] = await Promise.all([
    prisma.linter.findMany({
      include: includeLinters,
      take: 5,
      orderBy: {
        package: {
          countWeeklyDownloads: Prisma.SortOrder.desc,
        },
      },
      where: actualLinter,
    }),
    prisma.linter.findMany({
      include: includeLinters,
      take: 5,
      orderBy: {
        package: {
          packageUpdatedAt: Prisma.SortOrder.desc,
        },
      },
      where: actualLinter,
    }),
    prisma.packageKeyword.groupBy({
      where: {
        name: {
          notIn: ['ESLint', 'lint', 'javascript', 'node'],
        },
      },
      take: 5,
      by: ['name'],
      _count: {
        name: true,
      },
      orderBy: {
        _count: {
          name: Prisma.SortOrder.desc,
        },
      },
    }),
    prisma.rule.groupBy({
      where: {
        deprecated: false, // Ignore deprecated rules.
        category: {
          notIn: ['Fill me in', 'base', 'recommended'],
        },
      },
      take: 5,
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: Prisma.SortOrder.desc,
        },
      },
    }),
  ]);

  const lintersPopularFixed = lintersPopular.map((linter) =>
    fixAnyDatesInObject(linter)
  );

  const lintersRecentlyUpdatedFixed = lintersRecentlyUpdated.map((linter) =>
    fixAnyDatesInObject(linter)
  );

  return {
    props: {
      data: {
        lintersPopular: lintersPopularFixed,
        lintersRecentlyUpdated: lintersRecentlyUpdatedFixed,
        commonLinterKeywords,
        commonRuleCategories,
      },
    },
  };
}

export default function index({
  data: {
    lintersPopular,
    lintersRecentlyUpdated,
    commonLinterKeywords,
    commonRuleCategories,
  },
}: {
  data: {
    lintersPopular: Prisma.LinterGetPayload<{
      include: typeof includeLinters;
    }>[];
    lintersRecentlyUpdated: Prisma.LinterGetPayload<{
      include: typeof includeLinters;
    }>[];
    commonLinterKeywords: Awaited<
      Prisma.GetPackageKeywordGroupByPayload<{
        by: ['name'];
        _count: {
          name: true;
        };
      }>
    >;
    commonRuleCategories: Awaited<
      Prisma.GetRuleGroupByPayload<{
        by: ['category'];
        _count: {
          category: true;
        };
      }>
    >;
  };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase Database</title>
        <meta property="og:title" content="LintBase Database" key="title" />
      </Head>
      <DatabaseNavigation />
      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        <Grid container spacing={4} columns={{ xs: 2, sm: 4, md: 5 }}>
          <Grid item xs={2}>
            <Typography variant="h6" className="text-center" marginBottom={2}>
              Popular Linters
            </Typography>
            <ul className="space-y-8">
              {lintersPopular.map((p) => (
                <li key={p.package.name}>
                  <LinterCard linter={p}></LinterCard>
                </li>
              ))}
            </ul>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="h6" className="text-center" marginBottom={2}>
              Recently Updated
            </Typography>
            <ul className="space-y-8">
              {lintersRecentlyUpdated.map((p) => (
                <li key={p.package.name}>
                  <LinterCard linter={p}></LinterCard>
                </li>
              ))}
            </ul>
          </Grid>
          <Grid item xs={2} md={1}>
            <Typography variant="h6" className="text-center" marginBottom={2}>
              Top Linter Keywords
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="linter list">
                <TableBody>
                  {commonLinterKeywords.map((obj) => (
                    <TableRow key={obj.name}>
                      <TableCell scope="col">
                        <Link
                          href={`/db/plugins/?keyword=${encodeURIComponent(
                            obj.name
                          )}`}
                        >
                          {obj.name}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="h6"
              className="text-center"
              marginBottom={2}
              marginTop={4}
            >
              Top Rule Categories
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="linter list">
                <TableBody>
                  {commonRuleCategories.map(
                    (obj) =>
                      obj.category && (
                        <TableRow key={obj.category}>
                          <TableCell scope="col">
                            <Link
                              href={`/db/rules/?category=${encodeURIComponent(
                                obj.category
                              )}`}
                            >
                              {obj.category}
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>

        <Footer />
      </main>
    </div>
  );
}
