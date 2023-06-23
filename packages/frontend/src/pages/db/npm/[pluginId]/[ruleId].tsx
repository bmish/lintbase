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
import { EMOJI_CONFIGS } from '@/utils/eslint';
import EmojiSeverityWarn from '@/components/EmojiSeverityWarn';
import EmojiSeverityOff from '@/components/EmojiSeverityOff';

interface IQueryParam {
  ruleId: string;
}

const include = {
  plugin: true,
  options: true,
  replacedBy: true,
  ruleConfigs: {
    include: {
      config: true,
    },
    orderBy: {
      config: {
        name: Prisma.SortOrder.asc,
      },
    },
  },
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
  const relevantConfigEmojis = Object.entries(EMOJI_CONFIGS).filter(
    ([config]) =>
      rule.ruleConfigs.some((ruleConfig) => config === ruleConfig.config.name)
  );

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

        {rule && rule.ruleConfigs.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="rule config list">
              <TableHead>
                <TableRow>
                  <TableCell scope="col" colSpan={2}>
                    Configuration
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rule.ruleConfigs.map((ruleConfig) => (
                  <TableRow
                    key={ruleConfig.config.name}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell scope="row">{ruleConfig.config.name}</TableCell>
                    <TableCell align="right" title={ruleConfig.config.name}>
                      {
                        relevantConfigEmojis.find(
                          ([commonConfig]) =>
                            commonConfig === ruleConfig.config.name
                        )?.[1]
                      }
                      {ruleConfig.severity === 'warn' && (
                        <EmojiSeverityWarn config={ruleConfig.config.name} />
                      )}
                      {ruleConfig.severity === 'off' && (
                        <EmojiSeverityOff config={ruleConfig.config.name} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

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
