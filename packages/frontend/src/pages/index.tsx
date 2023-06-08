import Header from '@/components/Header';
import PluginCard from '@/components/PluginCard';
import RuleCard from '@/components/RuleCard';
import { Plugin, Rule } from '@/types';
import { prisma } from '@/server/db';
import { fixPlugin, fixRule } from '@/utils';
import { Typography } from '@mui/material';

export async function getServerSideProps() {
  const rulesRandom = await prisma.rule.findMany({
    include: {
      plugin: true,
      options: true,
      replacedBy: true,
    },
    where: {
      deprecated: false, // Don't advertise deprecated rules.
      description: {
        not: null, // Don't advertise rules without descriptions.
      },
    },
  });
  const rulesRandomFixed = randomlyPickItemsFromArray(rulesRandom, 5).map(
    (rule) => fixRule(rule)
  );

  const pluginsPopular = await prisma.plugin.findMany({
    include: {
      rules: true,
      configs: true,
      keywords: true,
      versions: true,
    },
    take: 5,
    orderBy: {
      countWeeklyDownloads: 'desc',
    },
  });
  const pluginsPopularFixed = pluginsPopular.map((plugin) => fixPlugin(plugin));

  const pluginsRecentlyUpdated = await prisma.plugin.findMany({
    include: {
      rules: true,
      configs: true,
      keywords: true,
      versions: true,
    },
    take: 5,
    orderBy: {
      updatedAt: 'desc',
    },
  });
  const pluginsRecentlyUpdatedFixed = pluginsRecentlyUpdated.map((plugin) =>
    fixPlugin(plugin)
  );

  const pluginsRandom = await prisma.plugin.findMany({
    include: {
      rules: true,
      configs: true,
      keywords: true,
      versions: true,
    },
    where: {
      description: {
        not: null, // Don't advertise plugins without descriptions.
      },
    },
  });
  const pluginsRandomFixed = randomlyPickItemsFromArray(pluginsRandom, 5).map(
    (plugin) => fixPlugin(plugin)
  );

  return {
    props: {
      data: {
        pluginsPopular: pluginsPopularFixed,
        pluginsRecentlyUpdated: pluginsRecentlyUpdatedFixed,
        pluginsRandom: pluginsRandomFixed,
        rulesRandom: rulesRandomFixed,
      },
    },
  };
}

function randomlyPickItemsFromArray<T>(array: T[], count: number): T[] {
  const indicesUsed = new Set<number>();
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    let index = Math.floor(Math.random() * array.length);
    while (indicesUsed.has(index)) {
      index = Math.floor(Math.random() * array.length);
    }
    indicesUsed.add(index);
    result.push(array[index]);
  }
  return result;
}

export default function index({
  data: { pluginsPopular, pluginsRecentlyUpdated, pluginsRandom, rulesRandom },
}: {
  data: {
    pluginsPopular: Plugin[];
    pluginsRecentlyUpdated: Plugin[];
    pluginsRandom: Plugin[];
    rulesRandom: Rule[];
  };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 mx-auto min-h-full">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            {' '}
            <Typography variant="h6" className="mb-4 text-center">
              Random Plugins
            </Typography>
            <ul className="space-y-8">
              {pluginsRandom.map((p) => (
                <li key={p.name}>
                  <PluginCard plugin={p}></PluginCard>
                </li>
              ))}
            </ul>
          </div>
          <div>
            {' '}
            <Typography variant="h6" className="mb-4 text-center">
              Random Rules
            </Typography>
            <ul className="space-y-8">
              {rulesRandom.map((r) => (
                <li key={`${r.plugin.name}/${r.name}`}>
                  <RuleCard rule={r}></RuleCard>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
