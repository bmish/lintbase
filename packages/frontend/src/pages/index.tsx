import Header from '@/components/Header';
import PluginCard from '@/components/PluginCard';
import RuleCard from '@/components/RuleCard';
import { Plugin, Rule } from '@/types';
import { getPlugins } from '@/utils';

export function getServerSideProps() {
  const plugins = getPlugins();

  const pluginsRandomSelection = randomlyPickItemsFromArray(plugins, 5);

  const rulesRandomSelection = randomlyPickItemsFromArray(
    plugins.flatMap((plugin) => plugin.rules),
    5
  );

  return {
    props: {
      data: {
        pluginsRandomSelection,
        rulesRandomSelection,
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
