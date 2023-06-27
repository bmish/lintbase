import DatabaseNavigation from '@/components/DatabaseNavigation';
import PluginCard from '@/components/PluginCard';
import { prisma } from '@/server/db';
import { fixPlugin } from '@/utils/normalize';
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

const includePlugins = {
  rules: true,
  configs: true,
  keywords: true,
};

export async function getServerSideProps() {
  const [
    pluginsPopular,
    pluginsRecentlyUpdated,
    commonPluginKeywords,
    commonRuleCategories,
    linters,
  ] = await Promise.all([
    prisma.plugin.findMany({
      include: includePlugins,
      take: 5,
      orderBy: {
        countWeeklyDownloads: Prisma.SortOrder.desc,
      },
    }),
    prisma.plugin.findMany({
      include: includePlugins,
      take: 5,
      orderBy: {
        packageUpdatedAt: Prisma.SortOrder.desc,
      },
    }),
    prisma.pluginKeyword.groupBy({
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
    prisma.plugin.groupBy({
      take: 5,
      by: ['linter'],
      _count: {
        linter: true,
      },
      orderBy: {
        _count: {
          linter: Prisma.SortOrder.desc,
        },
      },
    }),
  ]);

  const pluginsPopularFixed = pluginsPopular.map((plugin) => fixPlugin(plugin));

  const pluginsRecentlyUpdatedFixed = pluginsRecentlyUpdated.map((plugin) =>
    fixPlugin(plugin)
  );

  return {
    props: {
      data: {
        pluginsPopular: pluginsPopularFixed,
        pluginsRecentlyUpdated: pluginsRecentlyUpdatedFixed,
        commonPluginKeywords,
        commonRuleCategories,
        linters,
      },
    },
  };
}

export default function index({
  data: {
    pluginsPopular,
    pluginsRecentlyUpdated,
    commonPluginKeywords,
    commonRuleCategories,
    linters,
  },
}: {
  data: {
    pluginsPopular: Prisma.PluginGetPayload<{
      include: typeof includePlugins;
    }>[];
    pluginsRecentlyUpdated: Prisma.PluginGetPayload<{
      include: typeof includePlugins;
    }>[];
    commonPluginKeywords: Awaited<
      Prisma.GetPluginGroupByPayload<{
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
    linters: Awaited<
      Prisma.GetPluginGroupByPayload<{
        by: ['linter'];
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
              Popular Plugins
            </Typography>
            <ul className="space-y-8">
              {pluginsPopular.map((p) => (
                <li key={p.name}>
                  <PluginCard plugin={p}></PluginCard>
                </li>
              ))}
            </ul>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="h6" className="text-center" marginBottom={2}>
              Recently Updated
            </Typography>
            <ul className="space-y-8">
              {pluginsRecentlyUpdated.map((p) => (
                <li key={p.name}>
                  <PluginCard plugin={p}></PluginCard>
                </li>
              ))}
            </ul>
          </Grid>
          <Grid item xs={2} md={1}>
            <Typography variant="h6" className="text-center" marginBottom={2}>
              Top Plugin Keywords
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="plugin list">
                <TableBody>
                  {commonPluginKeywords.map((obj) => (
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
              <Table aria-label="plugin list">
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

            <Typography
              variant="h6"
              className="text-center"
              marginBottom={2}
              marginTop={4}
            >
              Linters
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="linters list">
                <TableBody>
                  {linters.map(
                    (obj) =>
                      obj.linter && (
                        <TableRow key={obj.linter}>
                          <TableCell scope="col">
                            <Link
                              href={`/db/plugins/?linter=${encodeURIComponent(
                                obj.linter
                              )}`}
                            >
                              {obj.linter}
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
