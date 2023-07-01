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
} from '@mui/material';
import { prisma } from '@/server/db';
import { fixAnyDatesInObject } from '@/utils/normalize';
import { EMOJI_CONFIGS } from '@/utils/eslint';
import { Prisma } from '@prisma/client';
import Head from 'next/head';
import Footer from '@/components/Footer';
import DatabaseNavigation from '@/components/DatabaseNavigation';
import { Configuration, OpenAIApi } from 'openai';
import { useRouter } from 'next/router';
import { kmeans } from 'ml-kmeans';
import React from 'react';
import RuleTableTabbed from '@/components/RuleTableTabbed';
import { splitList } from '@/utils/split-list';

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

  if (!query.count || query.count === '1') {
    return {
      props: { data: { linter: linterFixed } },
    };
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const embeddings: number[][] = [];
  const rules = linter.rules;
  for (const rule of rules) {
    const response = await openai.createEmbedding({
      input: `${rule.name}: ${rule.description || ''}`,
      model: 'text-embedding-ada-002',
    });
    embeddings.push(response.data.data[0].embedding);
  }

  return {
    props: { data: { linter: linterFixed, embeddings } },
  };
}

function embeddingsToLists(
  countClusters: number,
  embeddings: number[][],
  linter: Prisma.LinterGetPayload<{ include: typeof include }>
) {
  const ruleIndexToCluster = kmeans(
    embeddings,
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
  data: { linter, embeddings },
}: {
  data: {
    linter: Prisma.LinterGetPayload<{ include: typeof include }>;
    embeddings?: number[][];
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
  listsOfRules.unshift({ rules: linter.rules, title: 'Alphabetical' });

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

        <Paper className="mt-8">
          <RuleTableTabbed
            listsOfRules={listsOfRules}
            relevantConfigEmojis={relevantConfigEmojis}
            pkg={linter.package}
          />
        </Paper>
        <Footer />
      </main>
    </div>
  );
}
