import DatabaseNavigation from '@/components/DatabaseNavigation';
import LinterCard from '@/components/LinterCard';
import { prisma } from '@/server/db';
import { fixAnyDatesInObject } from '@/utils/prisma';
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
import { getServerAuthSession } from '@/server/auth';
import { type GetServerSideProps } from 'next';
import { packageToLinkUs } from '@/utils/dynamic-fields';
import millify from 'millify';

const includeLinters = {
  rules: true,
  configs: true,
  package: {
    include: {
      ecosystem: true,
      keywords: true,
      versions: {
        include: {
          tags: true,
        },
      },
      repository: { include: { stars: true } },
      deprecatedReplacements: true,
    },
  },
  lintees: true,
  lintFramework: true,
};

const actualLinter = {
  OR: [{ rules: { some: {} } }, { configs: { some: {} } }], // Actual linter with rules or configs.
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerAuthSession(context);

  const [
    lintersPopular,
    lintersTrending,
    lintersMostStarred,
    packageVersionTagsLatest,
    commonLinterKeywords,
    commonRuleCategories,
  ] = await Promise.all([
    prisma.linter.findMany({
      include: includeLinters,
      take: 5,
      orderBy: {
        package: {
          countDownloadsThisWeek: Prisma.SortOrder.desc,
        },
      },
      where: actualLinter,
    }),
    prisma.linter.findMany({
      include: includeLinters,
      take: 5,
      orderBy: {
        package: {
          percentDownloadsWeekOverWeek: Prisma.SortOrder.desc,
        },
      },
      where: {
        package: {
          percentDownloadsWeekOverWeek: {
            not: null,
          },
          countDownloadsThisWeek: {
            gt: 1000, // Ignore linters with low download counts.
          },
        },
      },
    }),
    prisma.linter.findMany({
      include: includeLinters,
      take: 5,
      orderBy: {
        package: {
          repository: {
            countStargazers: Prisma.SortOrder.desc,
          },
        },
      },
      where: {
        package: {
          repository: {
            countStargazers: {
              not: null,
            },
          },
        },
      },
    }),
    prisma.packageVersionTag.findMany({
      include: {
        packageVersion: {
          include: {
            package: {
              include: {
                linter: { include: includeLinters },
              },
            },
          },
        },
      },
      take: 5,
      orderBy: {
        packageVersion: {
          publishedAt: Prisma.SortOrder.desc,
        },
      },
      where: {
        packageVersion: {
          package: {
            linter: actualLinter,
          },
        },
        name: 'latest',
      },
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

  return {
    props: {
      data: {
        lintersPopular: lintersPopular.map((linter) =>
          fixAnyDatesInObject(linter)
        ),
        lintersTrending: lintersTrending.map((linter) =>
          fixAnyDatesInObject(linter)
        ),
        lintersMostStarred: lintersMostStarred.map((linter) =>
          fixAnyDatesInObject(linter)
        ),
        packageVersionTagsLatest: packageVersionTagsLatest.map((obj) =>
          fixAnyDatesInObject(obj)
        ),
        commonLinterKeywords,
        commonRuleCategories,
        userId: session?.user.id,
      },
    },
  };
};

export default function index({
  data: {
    lintersPopular,
    lintersTrending,
    lintersMostStarred,
    packageVersionTagsLatest,
    commonLinterKeywords,
    commonRuleCategories,
    userId,
  },
}: {
  data: {
    lintersPopular: Prisma.LinterGetPayload<{
      include: typeof includeLinters;
    }>[];
    lintersTrending: Prisma.LinterGetPayload<{
      include: typeof includeLinters;
    }>[];
    lintersMostStarred: Prisma.LinterGetPayload<{
      include: typeof includeLinters;
    }>[];
    packageVersionTagsLatest: Prisma.PackageVersionTagGetPayload<{
      include: {
        packageVersion: {
          include: {
            package: {
              include: {
                linter: { include: typeof includeLinters };
              };
            };
          };
        };
      };
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
    userId?: string;
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
              Popular Linters 🔥
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
              Recently Updated 🔄
            </Typography>
            <ul className="space-y-8">
              {packageVersionTagsLatest.map((pvt) => (
                <li key={pvt.packageVersion.package.linter?.id}>
                  {pvt.packageVersion.package.linter && (
                    <LinterCard
                      linter={pvt.packageVersion.package.linter}
                      userId={userId}
                    ></LinterCard>
                  )}
                </li>
              ))}
            </ul>
          </Grid>
          <Grid item xs={2} md={1}>
            <Typography variant="h6" className="text-center" marginBottom={2}>
              Trending Linters 📈
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="linter list trending">
                <TableBody>
                  {lintersTrending.map((obj) => (
                    <TableRow key={obj.package.name}>
                      <TableCell scope="row">
                        <Link href={packageToLinkUs(obj.package)}>
                          {obj.package.name}
                        </Link>
                      </TableCell>
                      <TableCell scope="row" align="right">
                        +{obj.package.percentDownloadsWeekOverWeek}%
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
              Most Starred ⭐
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="linter list most starred">
                <TableBody>
                  {lintersMostStarred.map((obj) => (
                    <TableRow key={obj.package.name}>
                      <TableCell scope="row">
                        <Link href={packageToLinkUs(obj.package)}>
                          {obj.package.name}
                        </Link>
                      </TableCell>
                      <TableCell scope="row" align="right">
                        {obj.package.repository?.countStargazers &&
                          millify(obj.package.repository.countStargazers)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="h6"
              className="text-center"
              marginTop={4}
              marginBottom={2}
            >
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
