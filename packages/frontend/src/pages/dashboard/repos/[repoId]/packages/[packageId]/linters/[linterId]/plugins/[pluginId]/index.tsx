/* eslint filenames/match-exported:"off" */
/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import {
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import DashboardRuleRow from '@/components/DashboardRuleRow';

const include = {
  localPackage: {
    include: {
      repository: true,
    },
  },
  linter: {
    include: {
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
      package: { include: { versions: true } },
      lintFramework: {
        include: {
          linter: { include: { package: true } },
        },
      },
    },
  },
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const repoId = params?.repoId as string;
  const packageId = params?.packageId as string;
  const linterId = params?.linterId as string;
  const pluginId = params?.pluginId as string;

  const session = await getServerAuthSession(context);
  if (!session) {
    return { props: {} };
  }

  const localPackageLinter = await prisma.localPackageLinter.findFirstOrThrow({
    where: {
      linter: {
        package: {
          name: pluginId,
        },
        lintFramework: {
          name: linterId,
        },
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
  const localPackageLinterFixed = fixAnyDatesInObject(localPackageLinter);

  return {
    props: {
      data: {
        localPackageLinter: localPackageLinterFixed,
      },
    },
  };
};

export default function Repo({
  data: { localPackageLinter },
}: {
  data: {
    localPackageLinter: Prisma.LocalPackageLinterGetPayload<{
      include: typeof include;
    }>;
  };
}) {
  const { data: session } = useSession();

  if (!session) {
    return <AccessDenied />;
  }

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>
          LintBase Dashboard -{' '}
          {localPackageLinter.localPackage.repository.fullName} -{' '}
          {localPackageLinter.localPackage.path} -{' '}
          {localPackageLinter.linter.lintFramework.name}
          {localPackageLinter.linter.package.name}
        </title>
        <meta
          property="og:title"
          content={`LintBase Dashboard - ${localPackageLinter.localPackage.repository.fullName} - ${localPackageLinter.localPackage.path} - ${localPackageLinter.linter.lintFramework.name} - ${localPackageLinter.linter.package.name}`}
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
                    localPackageLinter.localPackage.repository.fullName
                  )}`}
                >
                  {localPackageLinter.localPackage.repository.fullName}
                </Link>
              </Typography>
              <Typography variant="h5" color="text.secondary">
                {localPackageLinter.localPackage.path === '.'
                  ? 'Root'
                  : localPackageLinter.localPackage.path}
              </Typography>
              <Typography variant="h5" color="text.secondary">
                <Link
                  href={`/dashboard/repos/${encodeURIComponent(
                    localPackageLinter.localPackage.repository.fullName
                  )}/packages/${
                    localPackageLinter.localPackage.path === '.'
                      ? 'root'
                      : localPackageLinter.localPackage.path
                  }/linters/${localPackageLinter.linter.lintFramework.name}`}
                >
                  {lintFrameworkToDisplayName(
                    localPackageLinter.linter.lintFramework
                  )}
                </Link>
              </Typography>
              <Typography variant="h5" color="text.secondary">
                {localPackageLinter.linter.package.name}
              </Typography>
            </Breadcrumbs>
          </CardContent>
          <CardActions>
            <Button href={`/db/npm/${localPackageLinter.linter.package.name}`}>
              Plugin in Database
            </Button>
          </CardActions>
        </Card>

        <Paper className="mt-8">
          <TableContainer>
            <Table aria-label="configs">
              {localPackageLinter.linter.configs.length > 0 && (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell>Config</TableCell>
                      <TableCell></TableCell>
                      <TableCell>Violations</TableCell>
                      <TableCell>Autofixable</TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localPackageLinter.linter.configs.map((config) => (
                      <TableRow key="recommended">
                        <TableCell scope="row">{config.name}</TableCell>
                        <TableCell scope="row"></TableCell>
                        <TableCell scope="row">50</TableCell>
                        <TableCell scope="row">0%</TableCell>
                        <TableCell scope="row" align="right">
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
                              className="mr-4"
                            />
                          )}

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
                </>
              )}
            </Table>
          </TableContainer>
        </Paper>

        <Paper className="mt-8">
          <TableContainer>
            <Table aria-label="rules">
              {localPackageLinter.linter.rules.length > 0 && (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rule</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Violations</TableCell>
                      <TableCell>Autofixable</TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localPackageLinter.linter.rules.map((rule) => (
                      <DashboardRuleRow
                        key={rule.id}
                        rule={rule}
                        localPackageLinter={localPackageLinter}
                      />
                    ))}
                  </TableBody>
                </>
              )}
            </Table>
          </TableContainer>
        </Paper>

        <Footer />
      </main>
    </div>
  );
}
