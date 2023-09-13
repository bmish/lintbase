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

const include = {
  localPackage: {
    include: {
      repository: true,
      localPackageLinters: {
        include: {
          linter: {
            include: {
              lintFramework: true,
              package: { include: { versions: true } },
              rules: {
                include: {
                  localPackageRules: true,
                },
              },
              configs: {
                include: {
                  localPackageConfigs: {
                    include: {
                      config: true,
                    },
                  },
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

  if (!session) {
    return <AccessDenied />;
  }

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
                  ? 'Root'
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
              href={`/db/npm/${
                localPackageLintFramework.lintFramework.linter?.package
                  .name as string
              }`}
            >
              Linter in Database
            </Button>
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
          </CardActions>
        </Card>

        <Paper className="mt-8">
          <TableContainer>
            <Table aria-label="repo lint plugin list">
              <TableHead>
                <TableRow>
                  <TableCell>Plugin</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Latest</TableCell>
                  <TableCell align="right">Configs Enabled</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {localPackageLintFramework.localPackage.localPackageLinters.map(
                  (localPackageLinter) => (
                    <TableRow key={localPackageLinter.id}>
                      <TableCell scope="row">
                        <Link
                          href={`/dashboard/repos/${encodeURIComponent(
                            localPackageLintFramework.localPackage.repository
                              .fullName
                          )}/packages/${
                            localPackageLintFramework.localPackage.path === '.'
                              ? 'root'
                              : localPackageLintFramework.localPackage.path
                          }/linters/${
                            localPackageLinter.linter.lintFramework.name
                          }/plugins/${localPackageLinter.linter.package.name}`}
                        >
                          {localPackageLinter.linter.package.name}
                        </Link>
                      </TableCell>
                      <TableCell scope="row">
                        {localPackageLinter.version}
                      </TableCell>
                      <TableCell scope="row">
                        {
                          localPackageLinter.linter.package.versions.at(-1)
                            ?.version
                        }
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
                          .map((config) => (
                            <Chip key={config.id} label={config.name} />
                          ))}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Footer />
      </main>
    </div>
  );
}
