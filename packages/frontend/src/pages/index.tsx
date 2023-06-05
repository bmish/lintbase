import Header from '@/components/Header';
import PluginCard from '@/components/PluginCard';
import RuleCard from '@/components/RuleCard';
import { Plugin, Rule } from '@/types';
import { prisma } from '@/server/db';

export async function getStaticProps() {
  const rules = await prisma.rule.findMany({
    include: {
      plugin: true,
    },
    take: 25,
  });
  const rulesFixed = await rules.map((rule) => {
    return {
      ...rule,
      plugin: {
        ...rule.plugin,
        linkUs: `/npm/${encodeURIComponent(rule.plugin.name)}`,
        createdAt: rule.plugin.createdAt.toISOString(), // Since DataTime can't be serialized by next.
        updatedAt: rule.plugin.updatedAt.toISOString(), // Since DataTime can't be serialized by next.
      },
      linkUs: `/npm/${encodeURIComponent(
        rule.plugin.name
      )}/${encodeURIComponent(rule.name)}`,
      createdAt: rule.plugin.createdAt.toISOString(), // Since DataTime can't be serialized by next.
      updatedAt: rule.plugin.updatedAt.toISOString(), // Since DataTime can't be serialized by next.
    };
  });

  const plugins = await prisma.plugin.findMany({
    include: {
      rules: true,
      configs: true,
    },
    take: 25,
  });
  const pluginsFixed = plugins.map((plugin) => ({
    ...plugin,
    rules: plugin.rules.map((rule) => ({
      ...rule,
      createdAt: rule.createdAt.toISOString(), // Since DataTime can't be serialized by next.
      updatedAt: rule.updatedAt.toISOString(), // Since DataTime can't be serialized by next.
      linkUs: `/npm/${encodeURIComponent(plugin.name)}/${encodeURIComponent(
        rule.name
      )}`,
    })),
    linkUs: `/npm/${encodeURIComponent(plugin.name)}`,
    createdAt: plugin.createdAt.toISOString(), // Since DataTime can't be serialized by next.
    updatedAt: plugin.updatedAt.toISOString(), // Since DataTime can't be serialized by next.
  }));

  return {
    props: {
      data: {
        pluginsRandomSelection: pluginsFixed,
        rulesRandomSelection: rulesFixed,
      },
    },
  };
}

// function randomlyPickItemsFromArray<T>(array: T[], count: number): T[] {
//   const indicesUsed = new Set<number>();
//   const result: T[] = [];
//   for (let i = 0; i < count; i++) {
//     let index = Math.floor(Math.random() * array.length);
//     while (indicesUsed.has(index)) {
//       index = Math.floor(Math.random() * array.length);
//     }
//     indicesUsed.add(index);
//     result.push(array[index]);
//   }
//   return result;
// }

export default function index({
  data: { pluginsRandomSelection, rulesRandomSelection },
}: {
  data: { pluginsRandomSelection: Plugin[]; rulesRandomSelection: Rule[] };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-4xl mx-auto min-h-full">
        <div className="flex">
          <div className="w-1/2 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Random Plugins
            </h2>
            <ul className="space-y-8">
              {pluginsRandomSelection.map((p) => (
                <li key={p.name}>
                  <PluginCard plugin={p}></PluginCard>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-1/2 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Random Rules
            </h2>
            <ul className="space-y-8">
              {rulesRandomSelection.map((r) => (
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
