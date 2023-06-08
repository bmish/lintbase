/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import Header from '@/components/Header';
import RuleCard from '@/components/RuleCard';
import { Rule as RuleType } from '@/types';
import { prisma } from '@/server/db';
import { fixRule } from '@/utils';

interface IQueryParam {
  ruleId: string;
}

export async function getServerSideProps({ params }: { params: IQueryParam }) {
  const { ruleId } = params;

  const rule = await prisma.rule.findFirstOrThrow({
    where: {
      name: ruleId,
    },
    include: {
      plugin: true,
    },
  });
  const ruleFixed = fixRule(rule);

  return {
    props: { data: { rule: ruleFixed } },
  };
}

export default function Rule({ data: { rule } }: { data: { rule: RuleType } }) {
  return (
    <div className="bg-gray-100 h-full">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 mx-auto">
        {rule && <RuleCard rule={rule} detailed={true}></RuleCard>}
      </main>
    </div>
  );
}
