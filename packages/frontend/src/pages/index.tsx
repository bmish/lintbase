import { fixPlugin } from '@/utils/normalize';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import { prisma } from '@/server/db';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import Footer from '@/components/Footer';

export async function getServerSideProps() {
  const pluginsPopular = await prisma.plugin.findMany({
    take: 5,
    orderBy: {
      countWeeklyDownloads: 'desc',
    },
  });

  const pluginsPopularFixed = pluginsPopular.map((plugin) => fixPlugin(plugin));

  return {
    props: {
      data: {
        pluginsPopular: pluginsPopularFixed,
      },
    },
  };
}

export default function index({
  data: { pluginsPopular },
}: {
  data: {
    pluginsPopular: Prisma.PluginGetPayload<{}>[];
  };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <section className="bg-gray-800 text-white">
        <div className="container mx-auto py-20 px-8 md:px-0 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-left">
            Take your adoption of linting to the next level
          </h1>
          <p className="text-xl sm:text-2xl mb-8">
            Make developer tools like linting your superpower.
          </p>
        </div>
      </section>

      <section>
        <div className="flex flex-col md:flex-row max-w-3xl mx-auto">
          <div className="md:w-1/2 py-12 md:py-24 px-8 md:px-0  bg-gray-100">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive lint database
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              Discover powerful linting plugins and rules to apply to your
              codebases.
            </p>

            <Link
              href="/db"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Explore
            </Link>
          </div>
          <div className="md:w-1/2 pb-12 md:py-24  md:px-12">
            <TableContainer component={Paper} className="max-w-xs mx-auto">
              <Table aria-label="plugin list">
                <TableBody>
                  {pluginsPopular.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell scope="col">{p.name}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell align="center">
                      <Link href="/db/plugins">See more top plugins...</Link>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>
      </section>

      <section className="bg-gray-800 text-white ">
        <div className="container mx-auto py-20 px-8 md:px-0  max-w-3xl ">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            AI-powered lint builder
          </h1>
          <p className="text-xl sm:text-2xl mb-8">
            Design and build linting targeted at your developers or consumers of
            your libraries, SDKs, APIs, etc with the help of AI-powered
            suggestions (coming soon).
          </p>
        </div>
      </section>

      <section className=" bg-gray-100 text-black ">
        <div className="container mx-auto py-20 px-8 md:px-0  max-w-3xl ">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Unique quality insights
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-gray-700">
            Identify gaps in lint coverage. Better gauge the health of your
            codebases and lint tooling (coming soon).
          </p>
        </div>
      </section>

      <section className="bg-gray-800 text-white ">
        <div className="container mx-auto py-20 px-8 md:px-0 max-w-3xl flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
          <div className="md:w-1/3">
            <h2 className="text-2xl font-semibold">Improve app quality</h2>
            <p className="mt-4 ">
              Automatically enforce best practices and detect common mistakes.
            </p>
          </div>
          <div className="md:w-1/3">
            <h2 className="text-2xl font-semibold ">
              Boost developer productivity
            </h2>
            <p className="mt-4 ">
              Supercharge your development workflow with instant feedback and
              shorter feedback loops.
            </p>
          </div>

          <div className="md:w-1/3 ">
            <h2 className="text-2xl font-semibold ">
              Keep your app modern and up-to-date
            </h2>
            <p className="mt-4">
              Detect and automatically fix usage of deprecated syntax to
              facilitate dependency, framework, and language upgrades.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
