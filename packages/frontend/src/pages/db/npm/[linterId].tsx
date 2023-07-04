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
import { EMOJI_CONFIGS } from '@/utils/eslint';
import { Prisma } from '@prisma/client';
import Head from 'next/head';
import Footer from '@/components/Footer';
import DatabaseNavigation from '@/components/DatabaseNavigation';
import { useRouter } from 'next/router';
import { kmeans } from 'ml-kmeans';
import React from 'react';
import RuleTableTabbed from '@/components/RuleTableTabbed';
import { splitList } from '@/utils/split-list';
import { related } from '@/utils/related';
import { PineconeClient } from '@pinecone-database/pinecone';

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
  lintFramework: true,
};

export async function getServerSideProps({
  params,
  query,
}: {
  params: IQueryParam;
  query: {
    count?: string;
    showRelated?: string; // Hide by default until we cached the results.
  };
}) {
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

  // Similar linters:

  let lintersSimilar = null,
    lintersSimilarResponse = null;
  if (query.showRelated) {
    try {
      lintersSimilarResponse = await related({
        type: 'linter',
        ecosystemName: linter.package.ecosystem.name,
        linterName: linter.package.name,
        count: 3,
      });

      lintersSimilar = await Promise.all(
        lintersSimilarResponse?.map(async (result) => {
          const linter = await prisma.linter.findFirstOrThrow({
            where: {
              package: {
                ecosystem: {
                  name: result.id.split('#')[0],
                },
                name: result.id.split('#')[1],
              },
            },
            include,
          });
          return {
            linter: fixAnyDatesInObject(linter),
            score: result.score,
          };
        }) || []
      );
    } catch {
      // eslint-disable-next-line no-console
      console.log('Could not fetch similar linters');
    }
  }

  if (!query.count || query.count === '1') {
    return {
      props: { data: { linter: linterFixed, lintersSimilar } },
    };
  }

  // Experimental clustering feature:

  const environment = process.env.PINECONE_ENVIRONMENT;
  const apiKey = process.env.PINECONE_API_KEY;

  if (!environment || !apiKey) {
    return {
      props: { data: { linter: linterFixed, lintersSimilar } },
    };
  }

  const pinecone = new PineconeClient();
  await pinecone.init({
    environment,
    apiKey,
  });

  const rulesIndex = pinecone.Index('lintbase');

  const vectorIds = linter.rules.map(
    (rule) =>
      `${linter.package.ecosystem.name}#${linter.package.name}#${rule.name}`
  );
  const vectorResponse = await rulesIndex.fetch({
    ids: vectorIds,
    namespace: 'rule',
  });

  return {
    props: {
      data: {
        linter: linterFixed,
        lintersSimilar,
        embeddings: Object.entries(vectorResponse.vectors || {})
          .map(([ruleName, vector]) => ({
            ruleName: ruleName.split('#')[2],
            values: vector.values,
          }))
          .sort((a, b) => a.ruleName.localeCompare(b.ruleName)), // Ensure the ordering of vectors matches the ordering of rules to that they correspond.
      },
    },
  };
}

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
  data: { linter, lintersSimilar, embeddings },
}: {
  data: {
    linter: Prisma.LinterGetPayload<{ include: typeof include }>;
    lintersSimilar?: {
      linter: Prisma.LinterGetPayload<{ include: typeof include }>;
      score: number;
    }[];
    embeddings: { ruleName: string; values: number[] }[];
  };
}) {
  const router = useRouter();
  const countClusters = router.query.count;

  const listsOfRules = embeddings
    ? embeddingsToLists(Number(countClusters), embeddings, linter)
    : linter.rules.some((rule) => rule.category)
    ? splitList(linter.rules, ['category']).map((obj) => ({
        title: obj.title,
        rules: obj.items,
      }))
    : [];
  if (linter.rules.length > 0) {
    listsOfRules.unshift({ rules: linter.rules, title: 'Alphabetical' });
  }

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

        {lintersSimilar && lintersSimilar.length > 0 && (
          <div className="mt-8">
            <Typography className="mb-2">Related Plugins</Typography>
            <div className="flex md:flex-row flex-col justify-between">
              {lintersSimilar.map((obj) => (
                <div
                  className="flex-grow md:mr-8 last:md:mr-0 md:mb-0 mb-8 last:mb-0"
                  key={obj.linter.id}
                >
                  <LinterCard linter={obj.linter} />
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

        {listsOfRules.length > 0 && (
          <Paper className="mt-8">
            <RuleTableTabbed
              listsOfRules={listsOfRules}
              relevantConfigEmojis={relevantConfigEmojis}
              pkg={linter.package}
            />
          </Paper>
        )}

        <Footer />
      </main>
    </div>
  );
}
