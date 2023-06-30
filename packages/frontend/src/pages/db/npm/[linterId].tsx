/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import LinterCard from '@/components/LinterCard';
import {
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { prisma } from '@/server/db';
import { fixAnyDatesInObject } from '@/utils/normalize';
import { ruleToLinkUs } from '@/utils/dynamic-fields';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { EMOJI_CONFIGS } from '@/utils/eslint';
import { Prisma } from '@prisma/client';
import Head from 'next/head';
import EmojiHasSuggestions from '@/components/EmojiHasSuggestions';
import EmojiFixable from '@/components/EmojiFixable';
import EmojiRequiresTypeChecking from '@/components/EmojiRequiresTypeChecking';
import EmojiTypeLayout from '@/components/EmojiTypeLayout';
import EmojiTypeProblem from '@/components/EmojiTypeProblem';
import EmojiTypeSuggestion from '@/components/EmojiTypeSuggestion';
import EmojiOptions from '@/components/EmojiOptions';
import EmojiDeprecated from '@/components/EmojiDeprecated';
import EmojiType from '@/components/EmojiType';
import EmojiSeverityWarn from '@/components/EmojiSeverityWarn';
import EmojiSeverityOff from '@/components/EmojiSeverityOff';
import Footer from '@/components/Footer';
import DatabaseNavigation from '@/components/DatabaseNavigation';

interface IQueryParam {
  linterId: string;
}

const include = {
  rules: {
    orderBy: {
      name: Prisma.SortOrder.asc,
    },
    include: {
      options: true,
      ruleConfigs: {
        include: {
          config: true,
        },
      },
    },
  },
  configs: {
    orderBy: {
      name: Prisma.SortOrder.asc,
    },
  },
  package: {
    include: { keywords: true, ecosystem: true },
  },
};

export async function getServerSideProps({ params }: { params: IQueryParam }) {
  const { linterId } = params;

  const linter = await prisma.linter.findFirstOrThrow({
    where: {
      package: {
        name: linterId,
      },
    },
    include,
  });
  const linterFixed = fixAnyDatesInObject(linter);

  return {
    props: { data: { linter: linterFixed } },
  };
}
export default function Linter({
  data: { linter },
}: {
  data: {
    linter: Prisma.LinterGetPayload<{ include: typeof include }>;
  };
}) {
  const relevantConfigEmojis = Object.entries(EMOJI_CONFIGS).filter(
    ([config]) =>
      linter.configs.some((linterConfig) => config === linterConfig.name)
  );

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase: {linter.package.name}</title>
        <meta
          property="og:title"
          content={`LintBase: ${linter.package.name}`}
          key="title"
        />
      </Head>

      <DatabaseNavigation />

      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        {linter && <LinterCard linter={linter} detailed={true}></LinterCard>}

        {linter && linter.configs.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="linter config list">
              <TableHead>
                <TableRow>
                  <TableCell scope="col" colSpan={2}>
                    Configuration
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linter.configs.map((config) => (
                  <TableRow
                    key={`${linter.package.name}/${config.name}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell scope="row">{config.name}</TableCell>
                    <TableCell align="right" title={config.name}>
                      {
                        relevantConfigEmojis.find(
                          ([commonConfig]) => commonConfig === config.name
                        )?.[1]
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {linter && linter.rules.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="linter rule list">
              <TableHead>
                <TableRow>
                  <TableCell scope="col">Rule</TableCell>
                  <TableCell scope="col" align="left">
                    Description
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiFixable />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiHasSuggestions />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiRequiresTypeChecking />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiType />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiOptions />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiDeprecated />
                  </TableCell>
                  {relevantConfigEmojis.map(([config, emoji]) => (
                    <TableCell
                      key={config}
                      align="right"
                      title={`Config: ${config}`}
                    >
                      {emoji}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {linter.rules.map((rule) => (
                  <TableRow
                    key={`${linter.package.name}/${rule.name}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell scope="row">
                      <Link
                        href={ruleToLinkUs(rule, linter.package)}
                        underline="none"
                      >
                        {rule.name}
                      </Link>
                    </TableCell>
                    <TableCell align="left">
                      {rule.description && (
                        // eslint-disable-next-line react/no-children-prop -- false positive
                        <ReactMarkdown children={rule.description} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {rule.fixable ? <EmojiFixable /> : ''}
                    </TableCell>
                    <TableCell align="right">
                      {rule.hasSuggestions ? <EmojiHasSuggestions /> : ''}
                    </TableCell>
                    <TableCell align="right">
                      {rule.requiresTypeChecking ? (
                        <EmojiRequiresTypeChecking />
                      ) : (
                        ''
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {rule.type === 'layout' ? <EmojiTypeLayout /> : ''}
                      {rule.type === 'problem' ? <EmojiTypeProblem /> : ''}
                      {rule.type === 'suggestion' ? (
                        <EmojiTypeSuggestion />
                      ) : (
                        ''
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {rule.options.length > 0 ? <EmojiOptions /> : ''}
                    </TableCell>
                    <TableCell align="right">
                      {rule.deprecated ? <EmojiDeprecated /> : ''}
                    </TableCell>
                    {relevantConfigEmojis.map(([config, emoji]) => (
                      <TableCell key={config} align="right">
                        {rule.ruleConfigs.some(
                          (ruleConfig) =>
                            ruleConfig.config.name === config &&
                            ruleConfig.severity === 'error'
                        ) ? (
                          <span title={`Errors in ${config}`}>{emoji}</span>
                        ) : (
                          ''
                        )}
                        {rule.ruleConfigs.some(
                          (ruleConfig) =>
                            ruleConfig.config.name === config &&
                            ruleConfig.severity === 'warn'
                        ) ? (
                          <EmojiSeverityWarn config={config} />
                        ) : (
                          ''
                        )}
                        {rule.ruleConfigs.some(
                          (ruleConfig) =>
                            ruleConfig.config.name === config &&
                            ruleConfig.severity === 'off'
                        ) ? (
                          <EmojiSeverityOff config={config} />
                        ) : (
                          ''
                        )}
                      </TableCell>
                    ))}
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
