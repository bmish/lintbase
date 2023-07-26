/* eslint filenames/match-exported:"off" */
/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import {
  Box,
  Button,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tabs,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import AccessDenied from '@/components/AccessDenied';
import DatabaseNavigation from '@/components/DashboardNavigation';
import { type GetServerSideProps } from 'next';
import React from 'react';
import Link from 'next/link';

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

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const repoId = params?.repoId as string;

  const repo: Repo = { name: repoId };

  return { props: { data: { repo } } };
};

export default function Repo({ data: { repo } }: { data: { repo: Repo } }) {
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

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase Dashboard Repository - {repo.name}</title>
        <meta
          property="og:title"
          content="LintBase Dashboard Repository - {repo.name}"
          key="title"
        />
      </Head>
      <DatabaseNavigation />

      <main className="py-8 px-6 mx-auto min-h-screen">
        <Paper className="p-8">
          <p>Repository page for: {repo.name}</p>
          <br></br>
        </Paper>

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
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="repo linters suggested">
                <TableBody>
                  {lintersSuggested.map((repo) => (
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
                        <Button variant="outlined">See Recommendations</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
          <TabPanel
            value={currentLintersTabIndex}
            index={1}
            key={1}
            prefix="linters-tab-"
          >
            <Table sx={{ minWidth: 650 }} aria-label="repo linters current">
              <TableBody>
                {lintersCurrent.map((repo, i) => (
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
            <TableContainer component={Paper}>
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
            <TableContainer component={Paper}>
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
            <TableContainer component={Paper}>
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
            <TableContainer component={Paper}>
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
