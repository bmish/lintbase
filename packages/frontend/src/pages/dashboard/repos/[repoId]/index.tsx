/* eslint filenames/match-exported:"off" */
/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
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
import { format } from 'timeago.js';

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

type Repo = { name: string };

const include = {
  localPackages: { include: { localPackageLintFrameworks: true } },
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const repoId = params?.repoId as string;

  const session = await getServerAuthSession(context);
  if (!session) {
    return { props: {} };
  }

  const repo = await prisma.repository.findFirstOrThrow({
    where: {
      fullName: repoId,
      owner: { id: session?.user.id },
    },
    include,
  });
  const repoFixed = fixAnyDatesInObject(repo);

  return { props: { data: { repo: repoFixed } } };
};

export default function Repo({
  data: { repo },
}: {
  data: { repo: Prisma.RepositoryGetPayload<{ include: typeof include }> };
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

  const lintersSuggested = [
    { name: 'eslint-plugin-ember' },
    { name: 'eslint-plugin-qunit' },
  ];
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

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase Dashboard Repository - {repo.fullName}</title>
        <meta
          property="og:title"
          content={`LintBase Dashboard Repository - ${repo.fullName}`}
          key="title"
        />
      </Head>
      <DatabaseNavigation />

      <main className="py-8 px-6 mx-auto min-h-screen">
        <Card>
          <CardContent>
            <Typography variant="h5">{repo.fullName}</Typography>
            <br />
            <p>{repo.description}</p>
            <br />
            <p>
              Apps / linters detected at:{' '}
              {repo.localPackages.map((localPackage, i) => (
                <span key={localPackage.id}>
                  <code>{localPackage.path}</code>
                  {localPackage.localPackageLintFrameworks.length > 0 && ' ('}
                  {localPackage.localPackageLintFrameworks.map(
                    (localPackageLintFramework) => (
                      <code key={localPackageLintFramework.id}>
                        {localPackageLintFramework.pathConfig}
                      </code>
                    )
                  )}
                  {localPackage.localPackageLintFrameworks.length > 0 && ')'}
                  {repo.localPackages.length > i + 1 && ', '}
                </span>
              ))}
              .
            </p>
            <br />
            <p>
              Imported:{' '}
              {repo.importedAt && (
                <span>{format(new Date(repo.importedAt).toString())} </span>
              )}
            </p>
            <br />
            <p>
              Refreshed:{' '}
              {repo.scannedAt && (
                <span>{format(new Date(repo.scannedAt).toString())} </span>
              )}
            </p>
            <br />
            <p>
              {repo.commitSha && (
                <span>
                  Last Commit:{' '}
                  <Link
                    href={`https://github.com/${repo.fullName}/commit/${repo.commitSha}`}
                  >
                    <code>{repo.commitSha.slice(0, 7)}</code>
                  </Link>
                  {repo.committedAt &&
                    ` (${format(repo.committedAt.toString())})`}
                </span>
              )}
            </p>
          </CardContent>
          <CardActions>
            <Button href={`https://github.com/${repo.fullName}`}>
              Repository
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
