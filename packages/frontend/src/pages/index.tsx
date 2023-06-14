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
        <div className="container mx-auto py-20 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Boost developer productivity
          </h1>
          <p className="text-xl sm:text-2xl mb-8">
            Supercharge your development workflow with our powerful linting and
            static analysis tools.
          </p>
        </div>
      </section>
      <section>
        <div className="flex flex-col md:flex-row max-w-3xl mx-auto">
          <div className="md:w-1/2 py-12 md:py-24 bg-gray-100">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive database
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              Discover the right lint plugins and rules tailored to your
              project&apos;s needs. Easily navigate and explore a vast
              collection of linting options to enhance your codebase.
            </p>
            <Link
              href="/db"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Explore
            </Link>
          </div>
          <div className="md:w-1/2 py-12 md:py-24 md:px-12">
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
      <section className="bg-gray-800 text-white">
        <div className="container mx-auto py-20 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            More soon...
          </h1>
        </div>
      </section>
      <section>
        <div className="container mx-auto py-10 max-w-3xl text-center">
          Copyright © 2023 LintBase
        </div>
      </section>
    </div>
  );
}
