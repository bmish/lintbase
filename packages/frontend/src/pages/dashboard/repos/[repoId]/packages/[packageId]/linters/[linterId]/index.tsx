/* eslint filenames/match-exported:"off" */
/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
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
        include: {
          linter: {
            include: {
              package: { include: { versions: true } },
              rules: {
                include: {
                  localPackageRules: true,
                },
              },
              configs: {
                include: {
                  localPackageConfigs: true,
                  ruleConfigs: true,
                },
              },
            },
          },
        },
      },
    },
  },
  lintFramework: {
    include: {
      linter: { include: { package: true } },
    },
  },
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

  if (!session) {
    return <AccessDenied />;
  }

  const handleLintersTabIndex = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setCurrentLintersTabIndex(newValue);
  };

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
              <Typography variant="h5">
                <Link href={'/dashboard/repos'}>Repositories</Link>
              </Typography>
              <Typography variant="h5">
                <Link
                  href={`/dashboard/repos/${encodeURIComponent(
                    localPackageLintFramework.localPackage.repository.fullName
                  )}`}
                >
                  {localPackageLintFramework.localPackage.repository.fullName}
                </Link>
              </Typography>
              <Typography variant="h5" color="text.secondary">
                {localPackageLintFramework.localPackage.path === '.'
                  ? '(Root)'
                  : localPackageLintFramework.localPackage.path}
              </Typography>
              <Typography variant="h5" color="text.secondary">
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
              Linter in Database
            </Button>
          </CardActions>
        </Card>

        <Paper className="mt-8">
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="repo linters list">
              <TableHead>
                <TableRow>
                  <TableCell>Linter</TableCell>
                  <TableCell width="110px">Version</TableCell>
                  <TableCell width="110px" align="right">
                    Latest
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {localPackageLintFramework.localPackage.localPackageLinters.map(
                  (localPackageLinter) => (
                    <TableRow key={localPackageLinter.id}>
                      <TableCell scope="row">
                        <Link
                          href={`/db/npm/${localPackageLinter.linter.package.name}`}
                        >
                          {localPackageLinter.linter.package.name}
                        </Link>
                      </TableCell>
                      <TableCell scope="row">
                        {localPackageLinter.version}
                      </TableCell>
                      <TableCell scope="row" align="right">
                        {
                          localPackageLinter.linter.package.versions.at(-1)
                            ?.version
                        }
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper className="mt-8">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentLintersTabIndex}
              onChange={handleLintersTabIndex}
              aria-label="repo linters configs and rules violations list"
              variant="scrollable"
              scrollButtons="auto"
            >
              {localPackageLintFramework.localPackage.localPackageLinters.map(
                (localPackageLinter, i) => (
                  <Tab
                    key={i}
                    label={localPackageLinter.linter.package.name}
                    id={`linters-tab-${i}`}
                  />
                )
              )}{' '}
            </Tabs>
          </Box>
          {localPackageLintFramework.localPackage.localPackageLinters.map(
            (localPackageLinter, i) => (
              <TabPanel
                value={currentLintersTabIndex}
                index={i}
                key={i}
                prefix="linters-tab-"
              >
                <TableContainer>
                  <Table
                    sx={{ minWidth: 650 }}
                    aria-label="repo rules novel"
                    size="small"
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Config</TableCell>
                        <TableCell width="110px">Violations</TableCell>
                        <TableCell width="110px">Autofixable</TableCell>
                        <TableCell width="110px">Status</TableCell>
                        <TableCell width="110px" align="right"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {localPackageLinter.linter.configs.map((config) => (
                        <TableRow key="recommended">
                          <TableCell scope="row">{config.name}</TableCell>
                          <TableCell scope="row">50</TableCell>
                          <TableCell scope="row">0%</TableCell>
                          <TableCell scope="row">
                            {config.localPackageConfigs.some(
                              (localPackageConfig) =>
                                localPackageConfig.localPackageId ===
                                localPackageLinter.localPackageId
                            ) && (
                              <Chip
                                label={'Enabled'}
                                key={config.id}
                                color="success"
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell scope="row" align="right">
                            {config.localPackageConfigs.some(
                              (localPackageConfig) =>
                                localPackageConfig.localPackageId ===
                                localPackageLinter.localPackageId
                            ) ? (
                              <Button variant="outlined" size="small">
                                Disable
                              </Button>
                            ) : (
                              <Button variant="outlined" size="small">
                                Enable
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rule</TableCell>
                        <TableCell>Violations</TableCell>
                        <TableCell>Autofixable</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {localPackageLinter.linter.rules.map((rule) => (
                        <TableRow
                          key={rule.name}
                          sx={{
                            '&:last-child td, &:last-child th': {
                              border: 0,
                            },
                          }}
                        >
                          <TableCell scope="row">
                            <Link
                              href={`/db/npm/${localPackageLinter.linter.package.name}/rules/${rule.name}`}
                            >
                              {rule.name}
                            </Link>
                          </TableCell>
                          <TableCell scope="row">25</TableCell>
                          <TableCell scope="row">25%</TableCell>
                          <TableCell scope="row" align="right">
                            {localPackageLinter.linter.configs
                              .filter((config) =>
                                config.localPackageConfigs.some(
                                  (localPackageConfig) =>
                                    localPackageConfig.localPackageId ===
                                    localPackageLinter.localPackageId
                                )
                              )
                              .filter((config) =>
                                config.ruleConfigs.some(
                                  (ruleConfig) => ruleConfig.ruleId === rule.id
                                )
                              )
                              .map((config) => (
                                <Chip
                                  label={`Enabled By: ${config.name}`}
                                  key={config.id}
                                  color="success"
                                  size="small"
                                />
                              ))}
                            {localPackageLinter.linter.rules
                              .flatMap((rule2) =>
                                rule2.localPackageRules.filter(
                                  (localPackageRule) =>
                                    localPackageRule.localPackageId ===
                                      localPackageLinter.localPackageId &&
                                    localPackageRule.ruleId === rule.id
                                )
                              )
                              .map((rule2) => (
                                <Chip
                                  label={`${
                                    rule2.severity === '2'
                                      ? 'Enabled'
                                      : rule2.severity === '1'
                                      ? 'Set To Warn'
                                      : 'Disabled'
                                  } Individually`}
                                  key={rule2.id}
                                  color={
                                    rule2.severity === '2'
                                      ? 'success'
                                      : rule2.severity === '1'
                                      ? 'warning'
                                      : 'error'
                                  }
                                  size="small"
                                />
                              ))}
                          </TableCell>
                          <TableCell align="right">
                            {localPackageLinter.linter.configs
                              .filter((config) =>
                                config.localPackageConfigs.some(
                                  (localPackageConfig) =>
                                    localPackageConfig.localPackageId ===
                                    localPackageLinter.localPackageId
                                )
                              )
                              .some((config) =>
                                config.ruleConfigs.some(
                                  (ruleConfig) => ruleConfig.ruleId === rule.id
                                )
                              ) ? (
                              <Button variant="outlined" size="small">
                                Disable
                              </Button>
                            ) : (
                              <Button variant="outlined" size="small">
                                Enable
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            )
          )}
        </Paper>

        <Footer />
      </main>
    </div>
  );
}
