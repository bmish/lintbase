/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import Footer from '@/components/Footer';
import RuleCard from '@/components/RuleCard';
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
import { Prisma } from '@prisma/client';
import Head from 'next/head';

interface IQueryParam {
  ruleId: string;
}

const include = {
  plugin: true,
  options: true,
  replacedBy: true,
};

export async function getServerSideProps({ params }: { params: IQueryParam }) {
  const { ruleId } = params;

  const rule = await prisma.rule.findFirstOrThrow({
    where: {
      name: ruleId,
    },
    include,
  });
  const ruleFixed = fixRule(rule);

  return {
    props: { data: { rule: ruleFixed } },
  };
}

export default function Rule({
  data: { rule },
}: {
  data: { rule: Prisma.RuleGetPayload<{ include: typeof include }> };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>
          LintBase: {rule.plugin.name}: {rule.name}
        </title>
        <meta
          property="og:title"
          content={`LintBase: ${rule.plugin.name}: ${rule.name}`}
          key="title"
        />
      </Head>

      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        {rule && <RuleCard rule={rule} detailed={true}></RuleCard>}

        {rule && rule.options.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="rule option list">
              <TableHead>
                <TableRow>
                  <TableCell scope="col">Option</TableCell>
                  <TableCell scope="col" align="right">
                    Type
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rule.options.map((option) => (
                  <TableRow
                    key={`${rule.name}/${option.name}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell scope="row">{option.name}</TableCell>
                    <TableCell scope="row" align="right">
                      {option.type}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Footer />
      </main>
    </div>
  );
}
