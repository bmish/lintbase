/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import LinterCard from '@/components/LinterCard';
import {
  Box,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
} from '@mui/material';
import { prisma } from '@/server/db';
import { fixAnyDatesInObject } from '@/utils/normalize';
import { EMOJI_CONFIGS } from '@/utils/eslint';
import { Prisma } from '@prisma/client';
import Head from 'next/head';
import Footer from '@/components/Footer';
import DatabaseNavigation from '@/components/DatabaseNavigation';
import RuleTable from '@/components/RuleTable';
import { Configuration, OpenAIApi } from 'openai';
import { useRouter } from 'next/router';
import { kmeans } from 'ml-kmeans';
import React from 'react';

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
    .map((x, clusterIndex) =>
      linter.rules.filter(
        (_, ruleIndex) => ruleIndexToCluster[ruleIndex] === clusterIndex
      )
    );

  return listsOfRules;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rule-list-tab-panel-${index}`}
      aria-labelledby={`rule-list-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yPropsRuleListTab(index: number) {
  return {
    id: `rule-list-tab-${index}`,
    'aria-controls': `rule-list-tab-${index}`,
  };
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
    : [linter.rules];

  const relevantConfigEmojis = Object.entries(EMOJI_CONFIGS).filter(
    ([config]) =>
      linter.configs.some((linterConfig) => config === linterConfig.name)
  );

  const [currentRuleListIndex, setCurrentRuleListIndex] = React.useState(0);
  const handleChangeCurrentRuleListIndex = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setCurrentRuleListIndex(newValue);
  };

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
          {listsOfRules.length > 1 && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={currentRuleListIndex}
                onChange={handleChangeCurrentRuleListIndex}
                aria-label="rule list tabs"
              >
                {listsOfRules.map((rules, i) => (
                  <Tab
                    key={i}
                    label={`Cluster ${i + 1}`}
                    {...a11yPropsRuleListTab(i)}
                  />
                ))}
              </Tabs>
            </Box>
          )}
          {listsOfRules.map((rules, i) => (
            <TabPanel value={i} index={0} key={i}>
              <RuleTable
                rules={rules}
                pkg={linter.package}
                relevantConfigEmojis={relevantConfigEmojis}
              />
            </TabPanel>
          ))}
        </Paper>
        <Footer />
      </main>
    </div>
  );
}
