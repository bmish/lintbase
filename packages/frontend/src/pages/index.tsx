import Header from '@/components/Header';
import PluginCard from '@/components/PluginCard';
import RuleCard from '@/components/RuleCard';
import { FAKE_PLUGINS } from '@/data';

export default function index() {
  return (
    <div className="bg-gray-100 h-screen">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-4xl mx-auto">
        <div className="flex">
          <div className="w-1/2 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Top Plugins</h2>
            <ul>
              {FAKE_PLUGINS.map((p) => (
                <li key={p.name}>
                  <PluginCard plugin={p}></PluginCard>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-1/2 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Top Rules</h2>
            <ul>
              <li>
                <RuleCard rule={FAKE_PLUGINS[0].rules[0]}></RuleCard>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
