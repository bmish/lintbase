import Header from '@/components/Header';
import PluginCard from '@/components/PluginCard';
import { FAKE_PLUGINS } from '@/data';

export default function Plugins() {
  return (
    <div className="bg-gray-100 h-screen">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-4xl mx-auto">
        <ul>
          {FAKE_PLUGINS.map((p) => (
            <li key={p.name}>
              <PluginCard plugin={p}></PluginCard>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
