/* eslint filenames/match-exported:"off" */
/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import AccessDenied from '@/components/AccessDenied';
import DatabaseNavigation from '@/components/DashboardNavigation';
import { getServerAuthSession } from '@/server/auth';
import { type GetServerSideProps } from 'next';
import React from 'react';
import Link from 'next/link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { fixAnyDatesInObject } from '@/utils/normalize';
import { lintFrameworkToDisplayName } from '@/utils/dynamic-fields';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  prefix: string;
}

// Based on: https://mui.com/material-ui/react-tabs/
function TabPanel(props: TabPanelProps) {
  const { children, value, index, prefix, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`${prefix}${index}`}
      aria-labelledby={`${prefix}${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const include = {
  localPackage: {
    include: {
      repository: true,
      localPackageLinters: {
        include: { linter: { include: { package: true } } },
      },
    },
  },
  lintFramework: { include: { linter: { include: { package: true } } } },
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const repoId = params?.repoId as string;
  const packageId = params?.packageId as string;
  const linterId = params?.linterId as string;

  const session = await getServerAuthSession(context);
  if (!session) {
    return { props: {} };
  }

  const localPackageLintFramework =
    await prisma.localPackageLintFramework.findFirstOrThrow({
      where: {
        lintFramework: {
          name: linterId,
        },
        localPackage: {
          path: packageId === 'root' ? '.' : packageId,
          repository: {
            fullName: repoId,
            owner: { id: session?.user.id },
          },
        },
      },
      include,
    });
  const localPackageLintFrameworkFixed = fixAnyDatesInObject(
    localPackageLintFramework
  );

  return {
    props: {
      data: { localPackageLintFramework: localPackageLintFrameworkFixed },
    },
  };
};

export default function Repo({
  data: { localPackageLintFramework },
}: {
  data: {
    localPackageLintFramework: Prisma.LocalPackageLintFrameworkGetPayload<{
      include: typeof include;
    }>;
  };
}) {
  const { data: session } = useSession();

  const [currentLintersTabIndex, setCurrentLintersTabIndex] = React.useState(0);
  const [currentPRsTabIndex, setCurrentPRsTabIndex] = React.useState(0);
  const [currentRulesTabIndex, setCurrentRulesTabIndex] = React.useState(0);

  if (!session) {
    return <AccessDenied />;
  }

  const handleLintersTabIndex = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setCurrentLintersTabIndex(newValue);
  };

  const handleCurrentPRsTabIndex = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setCurrentPRsTabIndex(newValue);
  };

  const handleCurrentRulesTabIndex = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setCurrentRulesTabIndex(newValue);
  };

  const lintersSuggested =
    localPackageLintFramework.localPackage.localPackageLinters.map(
      (localPackageLinter) => ({ name: localPackageLinter.linter.package.name })
    );
  const lintersCurrent = [{ name: 'eslint' }, { name: 'eslint-plugin-import' }];

  const prsActive = [
    { name: 'eslint-plugin-ember / no-get' },
    { name: 'eslint-plugin-qunit / recommended' },
  ];
  const prsClosed = [
    { name: 'eslint / no-shadow' },
    { name: 'eslint-plugin-import / recommended' },
  ];

  const rulesNovel = [
    { name: 'Engineers frequently make some problem with x.' },
    { name: 'Another recurring issue in PRs.' },
  ];
  const rulesSuggested = [{ name: 'yoda' }, { name: 'ember/no-get' }];

  const configsInLinter = [
    { name: 'recommended', enabled: true },
    {
      name: 'stylistic',
      enabled: false,
      violations: 67,
      violationsFixable: 82,
    },
  ];
  const rulesInLinter = [
    { name: 'no-get', enabled: true },
    {
      name: 'no-get-with-properties',
      enabled: false,
      violations: 15,
      violationsFixable: 75,
    },
    {
      name: 'order-in-components',
      enabled: false,
      violations: 7,
      violationsFixable: 100,
    },
    {
      name: 'order-in-routes',
      enabled: false,
      violations: 23,
      violationsFixable: 100,
    },
  ];

  const localPackage = { path: '.eslintrc.js' };

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>
          LintBase Dashboard -{' '}
          {localPackageLintFramework.localPackage.repository.fullName} -{' '}
          {localPackageLintFramework.localPackage.path} -{' '}
          {localPackageLintFramework.lintFramework.name}
        </title>
        <meta
          property="og:title"
          content={`LintBase Dashboard - ${localPackageLintFramework.localPackage.path} - ${localPackageLintFramework.localPackage.repository.fullName} - ${localPackageLintFramework.lintFramework.name}`}
          key="title"
        />
      </Head>
      <DatabaseNavigation />

      <main className="py-8 px-6 mx-auto min-h-screen">
        <Card>
          <CardContent>
            <Breadcrumbs aria-label="breadcrumb" className="mb-1">
              <Link
                href={`/dashboard/repos/${encodeURIComponent(
                  localPackageLintFramework.localPackage.repository.fullName
                )}`}
              >
                {localPackageLintFramework.localPackage.repository.fullName}
              </Link>
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                {localPackageLintFramework.localPackage.path === '.'
                  ? '(Root)'
                  : localPackageLintFramework.localPackage.path}
              </Typography>
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                {lintFrameworkToDisplayName(
                  localPackageLintFramework.lintFramework
                )}
              </Typography>
            </Breadcrumbs>
          </CardContent>
          <CardActions>
            <Button
              href={`https://github.com/${
                localPackageLintFramework.localPackage.repository.fullName
              }/blob/${
                localPackageLintFramework.localPackage.repository
                  .commitSha as string
              }/${localPackage.path}`}
            >
              Config File
            </Button>
            <Button
              href={`/db/npm/${
                localPackageLintFramework.lintFramework.linter?.package
                  .name as string
              }`}
            >
              Linter
            </Button>
          </CardActions>
        </Card>

        <Paper className="mt-8">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentLintersTabIndex}
              onChange={handleLintersTabIndex}
              aria-label="repo linters"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                key={0}
                label={'Suggested Linters'}
                id={`linters-tab-${0}`}
              />
              <Tab key={1} label={'Current Linters'} id={`linters-tab-${1}`} />
            </Tabs>
          </Box>
          <TabPanel
            value={currentLintersTabIndex}
            index={0}
            key={1}
            prefix="linters-tab-"
          >
            {lintersSuggested.map((repo) => (
              <Accordion key={repo.name}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >
                  <Typography>{repo.name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table
                      sx={{ minWidth: 650 }}
                      aria-label="repo rules novel"
                      size="small"
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>Config</TableCell>
                          <TableCell>Violations</TableCell>
                          <TableCell>Autofixable</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {configsInLinter.map((repo) => (
                          <TableRow
                            key="recommended"
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                            }}
                          >
                            <TableCell scope="row">{repo.name}</TableCell>
                            <TableCell scope="row">{repo.violations}</TableCell>
                            <TableCell scope="row">
                              {repo.violationsFixable &&
                                `${repo.violationsFixable}%`}
                            </TableCell>
                            <TableCell scope="row" align="right">
                              {repo.enabled && (
                                <Button variant="outlined">Disable</Button>
                              )}
                              {!repo.enabled && (
                                <Button variant="outlined">Enable</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableHead>
                        <TableRow>
                          <TableCell>Rule</TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rulesInLinter.map((repo) => (
                          <TableRow
                            key={repo.name}
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                            }}
                          >
                            <TableCell scope="row">{repo.name}</TableCell>
                            <TableCell scope="row">{repo.violations}</TableCell>
                            <TableCell scope="row">
                              {repo.violationsFixable &&
                                `${repo.violationsFixable}%`}
                            </TableCell>
                            <TableCell scope="row" align="right">
                              {repo.enabled && (
                                <Button variant="outlined">Disable</Button>
                              )}
                              {!repo.enabled && (
                                <Button variant="outlined">Enable</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </TabPanel>
          <TabPanel
            value={currentLintersTabIndex}
            index={1}
            key={1}
            prefix="linters-tab-"
          >
            <Table sx={{ minWidth: 650 }} aria-label="repo linters current">
              <TableBody>
                {lintersCurrent.map((repo) => (
                  <TableRow
                    key={repo.name}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                    }}
                  >
                    <TableCell scope="row">
                      <Link href={`/dashboard/repos/${repo.name}`}>
                        {repo.name}
                      </Link>
                    </TableCell>
                    <TableCell scope="row" align="right">
                      <Button variant="outlined">See Status</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabPanel>
        </Paper>

        <Paper className="mt-8">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentRulesTabIndex}
              onChange={handleCurrentRulesTabIndex}
              aria-label="repo rules"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                key={0}
                label={'Novel Rule Concepts'}
                id={`rules-tab-${0}`}
              />
              <Tab key={1} label={'Suggested Rules'} id={`rules-tab-${1}`} />
            </Tabs>
          </Box>
          <TabPanel
            value={currentRulesTabIndex}
            index={0}
            key={1}
            prefix="rules-tab-"
          >
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="repo rules novel">
                <TableBody>
                  {rulesNovel.map((repo) => (
                    <TableRow
                      key={repo.name}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell scope="row">{repo.name}</TableCell>
                      <TableCell scope="row" align="right">
                        <Button variant="outlined">Create Rule</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
          <TabPanel
            value={currentRulesTabIndex}
            index={1}
            key={1}
            prefix="rules-tab-"
          >
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="repo rules suggested">
                <TableBody>
                  {rulesSuggested.map((repo) => (
                    <TableRow
                      key={repo.name}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell scope="row">
                        <Link href={`/dashboard/repos/${repo.name}`}>
                          {repo.name}
                        </Link>
                      </TableCell>
                      <TableCell scope="row" align="right">
                        <Button variant="outlined">Enable Rule</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>

        <Paper className="mt-8">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentPRsTabIndex}
              onChange={handleCurrentPRsTabIndex}
              aria-label="repo PRs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab key={0} label={'Active Lint PRs'} id={`prs-tab-${0}`} />
              <Tab key={1} label={'Closed Lint PRs'} id={`prs-tab-${1}`} />
            </Tabs>
          </Box>
          <TabPanel
            value={currentPRsTabIndex}
            index={0}
            key={1}
            prefix="prs-tab-"
          >
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="repo PRs open">
                <TableBody>
                  {prsActive.map((repo) => (
                    <TableRow
                      key={repo.name}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell scope="row">
                        <Link href={`/dashboard/repos/${repo.name}`}>
                          {repo.name}
                        </Link>
                      </TableCell>
                      <TableCell scope="row" align="right">
                        <Button variant="outlined">View PR</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
          <TabPanel
            value={currentPRsTabIndex}
            index={1}
            key={1}
            prefix="prs-tab-"
          >
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="repo PRs closed">
                <TableBody>
                  {prsClosed.map((repo) => (
                    <TableRow
                      key={repo.name}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell scope="row">
                        <Link href={`/dashboard/repos/${repo.name}`}>
                          {repo.name}
                        </Link>
                      </TableCell>
                      <TableCell scope="row" align="right">
                        <Button variant="outlined">View PR</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>

        <Footer />
      </main>
    </div>
  );
}