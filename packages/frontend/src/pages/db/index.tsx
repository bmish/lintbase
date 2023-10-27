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
  processors: true,
  package: {
    include: {
      ecosystem: true,
      keywords: true,
      versions: {
        include: {
          tags: true,
        },
      },
      repository: { include: { stars: true, topics: true } },
      deprecatedReplacements: true,
      engines: true,
      peerDependencies: true,
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
        userId: session?.user.id || null,
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
    userId?: string;
  };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>Lintbase</title>
        <meta property="og:title" content="Lintbase" key="title" />
      </Head>
      <DatabaseNavigation />
      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        <Grid container spacing={4} columns={{ xs: 2, sm: 4, md: 5 }}>
          <Grid item xs={2}>
            <Typography
              variant="h6"
              className="text-center"
              marginBottom={2}
              title="Popular based on weekly download count from npm"
            >
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
            <Typography
              variant="h6"
              className="text-center"
              marginBottom={2}
              title="Recently published on npm"
            >
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
            <Typography
              variant="h6"
              className="text-center"
              marginBottom={2}
              title="Trending based on week-over-week downloads on npm"
            >
              Trending 📈
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
              title="Most starred on GitHub"
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
          </Grid>
        </Grid>

        <Footer />
      </main>
    </div>
  );
}
