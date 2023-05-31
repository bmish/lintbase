/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import Header from '@/components/Header';
import RuleCard from '@/components/RuleCard';
import { FAKE_PLUGINS } from '@/data';
import { useRouter } from 'next/router';

interface IQueryParam {
  ruleId: string;
}

export default function Plugin() {
  const router = useRouter();
  const { ruleId } = router.query as unknown as IQueryParam;

  const rule = FAKE_PLUGINS.flatMap((plugin) => plugin.rules).find(
    (rule) => rule.name === ruleId
  );

  return (
    <div className="bg-gray-100 h-screen">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-md mx-auto">
        {rule && <RuleCard rule={rule}></RuleCard>}
      </main>
    </div>
  );
}
