/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import LinterCard from '@/components/LinterCard';
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
import { prisma } from '@/server/db';
import { fixAnyDatesInObject } from '@/utils/normalize';
import { Prisma } from '@prisma/client';
import Head from 'next/head';
import Footer from '@/components/Footer';
import DatabaseNavigation from '@/components/DatabaseNavigation';
import { kmeans } from 'ml-kmeans';
import React from 'react';
import RuleTableTabbed from '@/components/RuleTableTabbed';
import { related } from '@/utils/related';
import { clusterNamesForRules } from '@/utils/summarize';
import { getVectors } from '@/utils/pinecone';
import { getServerAuthSession } from '@/server/auth';
import { type GetServerSideProps } from 'next';
import groupBy from 'lodash.groupby';
import { getConfigEmojis } from '@/utils/config-emoji';
import DatabaseConfigRow from '@/components/DatabaseConfigRow';

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
    include: {
      ruleConfigs: true,
    },
    orderBy: {
      name: Prisma.SortOrder.asc,
    },
  },
  package: {
    include: { keywords: true, ecosystem: true, versions: true },
  },
  lintFramework: true,
};

const COUNT_RELATED_LINTERS = 3;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params, query } = context;

  const linterId = params?.linterId as string;
  const {
    clusters,
    showRelated,
  }: {
    clusters?: string;
    showRelated?: string;
  } = query;

  const session = await getServerAuthSession(context);

  const linter = await prisma.linter.findFirstOrThrow({
    where: {
      package: {
        name: linterId,
      },
    },
    include,
  });
  const linterFixed = fixAnyDatesInObject(linter);

  // Related linters:

  let lintersRelated = null;
  if (showRelated || session) {
    try {
      const lintersRelatedResponse = await related({
        type: 'linter',
        ecosystemName: linter.package.ecosystem.name,
        linterName: linter.package.name,
        count: COUNT_RELATED_LINTERS * 3, // Request more than we need so we can pick out the higher quality ones (by downloads). Note that requesting too many could result in less-related choices.
      });
      lintersRelated = await prisma.linter.findMany({
        include,
        where: {
          OR:
            lintersRelatedResponse?.map((linterRelated) => ({
              package: {
                ecosystem: {
                  name: linterRelated.id.split('#')[0],
                },
                name: linterRelated.id.split('#')[1],
              },
            })) || [],
        },
        orderBy: {
          package: {
            countWeeklyDownloads: Prisma.SortOrder.desc,
          },
        },
        take: COUNT_RELATED_LINTERS,
      });
    } catch {
      // eslint-disable-next-line no-console
      console.log('Could not fetch related linters');
    }
  }

  const listsOfRules =
    linter.rules.length > 0
      ? [
          { rules: linter.rules, title: 'Alphabetical' },
          ...(linter.rules.some((rule) => rule.category)
            ? Object.entries(groupBy(linter.rules, 'category'))
                .sort((a, b) => a[0].localeCompare(b[0]))
                .flatMap(
                  ([title, rules]) =>
                    title
                      ? [
                          {
                            title,
                            rules,
                          },
                        ]
                      : [] // Skip rules without categories.
                )
            : []),
        ]
      : [];

  // Experimental clustering feature:

  if (clusters && Number(clusters) > 0) {
    const vectorIds = linter.rules.map(
      (rule) =>
        `${linter.package.ecosystem.name}#${linter.package.name}#${rule.name}`
    );
    try {
      const vectors = await getVectors(vectorIds, 'rule');

      const embeddings = Object.entries(vectors || {})
        .map(([ruleName, vector]) => ({
          ruleName: ruleName.split('#')[2],
          values: vector.values,
        }))
        .sort((a, b) => a.ruleName.localeCompare(b.ruleName)); // Ensure the ordering of vectors matches the ordering of rules to that they correspond.

      const clustersList = [];
      if (embeddings && embeddings.length > 0) {
        clustersList.push(
          ...embeddingsToLists(Number(clusters), embeddings, linter)
        );
      }

      const stringOfRuleClusters = listsOfRules
        .map((obj, i) => {
          const rulesList = obj.rules
            .map(
              (rule) =>
                `\t${[rule.name, rule.description].filter(Boolean).join(' - ')}`
            )
            .join('\n');
          return `Cluster ${i + 1}\n${rulesList}`;
        })
        .join('\n\n');
      const clusterNamesGenerated = await clusterNamesForRules(
        stringOfRuleClusters
      );

      if (clusterNamesGenerated.length === Number(clusters)) {
        for (const [i, clusterName] of clusterNamesGenerated.entries()) {
          clustersList[i].title = clusterName;
        }
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `Generated ${clusterNamesGenerated.length} cluster names, but ${clusters} were requested.`
        );
      }

      listsOfRules.push(...clustersList);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`Failed to perform clustering of rules: ${String(error)}`);
    }
  }

  return {
    props: {
      data: {
        linter: linterFixed,
        lintersRelated:
          lintersRelated?.map((obj) => fixAnyDatesInObject(obj)) || [],
        listsOfRules: listsOfRules.map((obj) => ({
          ...obj,
          rules: obj.rules.map((rule) => fixAnyDatesInObject(rule)),
        })),
      },
    },
  };
};

function embeddingsToLists(
  countClusters: number,
  embeddings: { ruleName: string; values: number[] }[],
  linter: Prisma.LinterGetPayload<{ include: typeof include }>
) {
  const ruleIndexToCluster = kmeans(
    embeddings.map((obj) => obj.values),
    Number(countClusters),
    {}
  ).clusters;

  const listsOfRules = Array.from({ length: Number(countClusters) })
    .fill('')
    .map((x, clusterIndex) => ({
      title: `Cluster ${clusterIndex + 1}`,
      rules: linter.rules.filter(
        (_, ruleIndex) => ruleIndexToCluster[ruleIndex] === clusterIndex
      ),
    }));

  return listsOfRules;
}
export default function Linter({
  data: { linter, lintersRelated, listsOfRules },
}: {
  data: {
    linter: Prisma.LinterGetPayload<{ include: typeof include }>;
    lintersRelated?: Prisma.LinterGetPayload<{ include: typeof include }>[];
    listsOfRules: {
      title: string;
      rules: Prisma.RuleGetPayload<{ include: typeof include.rules.include }>[];
    }[];
  };
}) {
  const configToEmoji = getConfigEmojis(linter.configs);

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

        {lintersRelated && lintersRelated.length > 0 && (
          <div className="mt-8">
            <Typography className="mb-2">Related Plugins</Typography>
            <div className="flex md:flex-row flex-col justify-between">
              {lintersRelated.map((linterRelated) => (
                <div
                  className="flex-grow md:mr-8 last:md:mr-0 md:mb-0 mb-8 last:mb-0"
                  key={linterRelated.id}
                >
                  <LinterCard linter={linterRelated} />
                </div>
              ))}
            </div>
          </div>
        )}

        {linter && linter.configs.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="linter config list">
              <TableHead>
                <TableRow>
                  <TableCell scope="col">Configuration</TableCell>
                  <TableCell scope="col" align="right">
                    Rules
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linter.configs.map((config) => (
                  <DatabaseConfigRow
                    key={config.id}
                    config={config}
                    configs={linter.configs}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {listsOfRules.length > 0 && (
          <Paper className="mt-8">
            <RuleTableTabbed
              listsOfRules={listsOfRules}
              configToEmoji={configToEmoji}
              pkg={linter.package}
            />
          </Paper>
        )}

        <Footer />
      </main>
    </div>
  );
}
