import PluginCard from '@/components/PluginCard';
import { prisma } from '@/server/db';
import { fixPlugin } from '@/utils/normalize';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { Prisma } from '@prisma/client';

const includePlugins = {
  rules: true,
  configs: true,
  keywords: true,
  versions: true,
};

export async function getServerSideProps() {
  const commonRuleCategories = await prisma.rule.groupBy({
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
        category: 'desc',
      },
    },
  });

  const pluginsPopular = await prisma.plugin.findMany({
    include: includePlugins,
    take: 5,
    orderBy: {
      countWeeklyDownloads: 'desc',
    },
  });
  const pluginsPopularFixed = pluginsPopular.map((plugin) => fixPlugin(plugin));

  const pluginsRecentlyUpdated = await prisma.plugin.findMany({
    include: includePlugins,
    take: 5,
    orderBy: {
      packageUpdatedAt: 'desc',
    },
  });
  const pluginsRecentlyUpdatedFixed = pluginsRecentlyUpdated.map((plugin) =>
    fixPlugin(plugin)
  );

  const commonPluginKeywords = await prisma.pluginKeyword.groupBy({
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
        name: 'desc',
      },
    },
  });

  return {
    props: {
      data: {
        pluginsPopular: pluginsPopularFixed,
        pluginsRecentlyUpdated: pluginsRecentlyUpdatedFixed,
        commonPluginKeywords,
        commonRuleCategories,
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
  };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 mx-auto min-h-screen">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          <div>
            <Typography variant="h6" className="mb-4 text-center">
              Popular Plugins
            </Typography>
            <ul className="space-y-8">
              {pluginsPopular.map((p) => (
                <li key={p.name}>
                  <PluginCard plugin={p}></PluginCard>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Typography variant="h6" className="mb-4 text-center">
              Recently Updated
            </Typography>
            <ul className="space-y-8">
              {pluginsRecentlyUpdated.map((p) => (
                <li key={p.name}>
                  <PluginCard plugin={p}></PluginCard>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Typography variant="h6" className="mb-4 text-center">
              Top Plugin Keywords
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="plugin list">
                <TableBody>
                  {commonPluginKeywords.map((obj) => (
                    <TableRow key={obj.name}>
                      <TableCell scope="col">{obj.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="h6" className="mb-4 text-center mt-8">
              Top Rule Categories
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="plugin list">
                <TableBody>
                  {commonRuleCategories.map((obj) => (
                    <TableRow key={obj.category}>
                      <TableCell scope="col">{obj.category}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          <div></div>
        </div>
      </main>
    </div>
  );
}
