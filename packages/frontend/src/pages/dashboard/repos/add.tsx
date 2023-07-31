/* eslint node/no-unsupported-features/es-syntax:"off" */
import Footer from '@/components/Footer';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import AccessDenied from '@/components/AccessDenied';
import DatabaseNavigation from '@/components/DashboardNavigation';
import {
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import Link from 'next/link';
import { App } from 'octokit';
import { type GetServerSideProps } from 'next';
import { env } from '@/env.mjs';
import { api } from '@/utils/api';
import { useRouter } from 'next/router';
import { getServerAuthSession } from '@/server/auth';
import { prisma } from '@/server/db';

type Repo = {
  full_name: string;
  language: string | null;
  size: number;
  description: string | null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const appId = 361_377; // https://github.com/settings/apps/lintbase
  const privateKey = env.GITHUB_PRIVATE_KEY;
  const app = new App({ appId, privateKey });

  const session = await getServerAuthSession(context);
  if (!session) {
    return { props: {} };
  }

  const repositories = await prisma.repository.findMany({
    where: {
      owner: { id: session.user.id },
    },
  });

  const repos: Repo[] = [];

  for await (const { repository } of app.eachRepository.iterator()) {
    if (repositories.some((repo) => repo.fullName === repository.full_name)) {
      // Already imported this repository.
      continue;
    }
    repos.push({
      full_name: repository.full_name,
      language: repository.language,
      size: repository.size,
      description: repository.description,
      // commitSha
    });
  }

  return { props: { data: { repositories: repos } } };
};

export default function Add({
  data: { repositories },
}: {
  data: {
    repositories: Repo[];
  };
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const repositoryAddMutation = api.repository.add.useMutation();
  const repositoryRefreshMutation = api.repository.refresh.useMutation();

  if (!session) {
    return <AccessDenied />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // @ts-expect-error -- custom hidden element
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const repositoryFullName = e.currentTarget.elements.repositoryFullName
      .value as string;
    const repository = repositories.find(
      (repo) => repo.full_name === repositoryFullName
    );

    if (!repository) {
      return;
    }

    repositoryAddMutation.mutate({
      fullName: repository.full_name,
      language: repository.language || undefined,
      size: repository.size,
      description: repository.description || undefined,
    });

    repositoryRefreshMutation.mutate({ fullName: repository.full_name });

    await router.push('/dashboard/repos');
  };

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase Dashboard Repositories</title>
        <meta
          property="og:title"
          content="LintBase Dashboard Repositories"
          key="title"
        />
      </Head>
      <DatabaseNavigation />
      <main className="py-8 px-6 mx-auto min-h-screen">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="linter config list">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Repository</TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    href="https://github.com/apps/lintbase/installations/select_target"
                  >
                    Update GitHub Permissions
                  </Button>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {repositories.map((repo) => (
                <TableRow
                  key={repo.full_name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link href={`https://github.com/${repo.full_name}`}>
                      {repo.full_name}
                    </Link>
                  </TableCell>
                  <TableCell scope="row" align="right">
                    {/* eslint-disable-next-line @typescript-eslint/no-misused-promises*/}
                    <form onSubmit={handleSubmit}>
                      <Button
                        type="submit"
                        variant="contained"
                        style={{
                          backgroundColor:
                            '#1976d2' /* Color is to avoid this issue https://stackoverflow.com/questions/75202373/button-in-material-ui-is-transparent-when-loading */,
                        }}
                      >
                        Import
                      </Button>
                      <input
                        type="hidden"
                        name="repositoryFullName"
                        value={repo.full_name}
                      />
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Footer />
      </main>
    </div>
  );
}
