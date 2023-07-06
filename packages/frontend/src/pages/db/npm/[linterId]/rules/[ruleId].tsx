/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import Footer from '@/components/Footer';
import RuleCard from '@/components/RuleCard';
import { prisma } from '@/server/db';
import { fixAnyDatesInObject } from '@/utils/normalize';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Prisma } from '@prisma/client';
import Head from 'next/head';
import { EMOJI_CONFIGS } from '@/utils/eslint';
import EmojiSeverityWarn from '@/components/EmojiSeverityWarn';
import EmojiSeverityOff from '@/components/EmojiSeverityOff';
import DatabaseNavigation from '@/components/DatabaseNavigation';
import { related } from '@/utils/related';
import { getServerAuthSession } from '@/server/auth';
import { type GetServerSideProps } from 'next';

const include = {
  linter: {
    include: {
      package: {
        include: { ecosystem: true },
      },
      lintFramework: true,
    },
  },
  options: {
    orderBy: {
      name: Prisma.SortOrder.asc,
    },
  },
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params, query } = context;
  const {
    showRelated,
  }: {
    showRelated?: string;
  } = query;
  const ruleId = params?.ruleId as string;

  const session = await getServerAuthSession(context);

  const rule = await prisma.rule.findFirstOrThrow({
    where: {
      name: ruleId,
    },
    include,
  });
  const ruleFixed = fixAnyDatesInObject(rule);

  // Similar rules:
  let rulesRelated = null,
    rulesRelatedResults = null;
  if (showRelated || session) {
    try {
      rulesRelatedResults = await related({
        type: 'rule',
        ecosystemName: rule.linter.package.ecosystem.name,
        linterName: rule.linter.package.name,
        ruleName: ruleId,
        count: 3,
      });

      rulesRelated = await Promise.all(
        rulesRelatedResults?.map(async (result) => {
          const rule = await prisma.rule.findFirstOrThrow({
            where: {
              name: result.id.split('#')[2],
              linter: {
                package: {
                  ecosystem: {
                    name: result.id.split('#')[0],
                  },
                  name: result.id.split('#')[1],
                },
              },
            },
            include,
          });
          return {
            rule: fixAnyDatesInObject(rule),
            score: result.score,
          };
        }) || []
      );
    } catch {
      // eslint-disable-next-line no-console
      console.log('Could not fetch similar rules');
    }
  }

  return {
    props: { data: { rule: ruleFixed, rulesRelated } },
  };
};

export default function Rule({
  data: { rule, rulesRelated },
}: {
  data: {
    rule: Prisma.RuleGetPayload<{ include: typeof include }>;
    rulesRelated?: {
      rule: Prisma.RuleGetPayload<{ include: typeof include }>;
      score: number;
    }[];
  };
}) {
  const relevantConfigEmojis = Object.entries(EMOJI_CONFIGS).filter(
    ([config]) =>
      rule.ruleConfigs.some((ruleConfig) => config === ruleConfig.config.name)
  );

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>
          LintBase: {rule.linter.package.name}: {rule.name}
        </title>
        <meta
          property="og:title"
          content={`LintBase: ${rule.linter.package.name}: ${rule.name}`}
          key="title"
        />
      </Head>

      <DatabaseNavigation />

      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        {rule && <RuleCard rule={rule} detailed={true}></RuleCard>}

        {rulesRelated && rulesRelated.length > 0 && (
          <div className="mt-8">
            <Typography className="mb-2">Related Rules</Typography>
            <div className="flex md:flex-row flex-col justify-between">
              {rulesRelated.map((obj) => (
                <div
                  className="flex-grow md:mr-8 last:md:mr-0 md:mb-0 mb-8 last:mb-0"
                  key={obj.rule.id}
                >
                  <RuleCard rule={obj.rule} />
                </div>
              ))}
            </div>
          </div>
        )}

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
