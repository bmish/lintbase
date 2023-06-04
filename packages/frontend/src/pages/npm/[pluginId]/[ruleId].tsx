/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import Header from '@/components/Header';
import RuleCard from '@/components/RuleCard';
import { useRouter } from 'next/router';
import { getPlugins } from '@/utils';
import { Plugin } from '@/types';

interface IQueryParam {
  ruleId: string;
}

export function getServerSideProps() {
  const plugins = getPlugins();

  return {
    props: {
      data: {
        plugins,
      },
    },
  };
}

export default function Rule({
  data: { plugins },
}: {
  data: { plugins: Plugin[] };
}) {
  const router = useRouter();
  const { ruleId } = router.query as unknown as IQueryParam;

  const rule = plugins
    .flatMap((plugin) => plugin.rules)
    .find((rule) => rule.name === ruleId);

  return (
    <div className="bg-gray-100 h-full">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-4xl mx-auto">
        {rule && <RuleCard rule={rule} detailed={true}></RuleCard>}
      </main>
    </div>
  );
}
