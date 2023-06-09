/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import RuleCard from '@/components/RuleCard';
import { Rule as RuleType } from '@/utils/types';
import { prisma } from '@/server/db';
import { fixRule } from '@/utils/normalize';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

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
      options: true,
      replacedBy: true,
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
      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 mx-auto min-h-screen">
        {rule && <RuleCard rule={rule} detailed={true}></RuleCard>}

        {rule && rule.options.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="rule option list">
              <TableHead>
                <TableRow>
                  <TableCell scope="col">Option</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rule.options.map((option) => (
                  <TableRow
                    key={`${rule.name}/${option.name}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell scope="row">{option.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </main>
    </div>
  );
}
