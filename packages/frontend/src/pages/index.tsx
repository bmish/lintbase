import { fixAnyDatesInObject } from '@/utils/normalize';
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
  const lintersPopular = await prisma.linter.findMany({
    take: 5,
    include: { package: true },
    orderBy: {
      package: {
        countWeeklyDownloads: Prisma.SortOrder.desc,
      },
    },
    where: {
      OR: [{ rules: { some: {} } }, { configs: { some: {} } }], // Actual linter with rules or configs.
    },
  });

  const lintersPopularFixed = lintersPopular.map((linter) =>
    fixAnyDatesInObject(linter)
  );

  return {
    props: {
      data: {
        lintersPopular: lintersPopularFixed,
      },
    },
  };
}

export default function index({
  data: { lintersPopular },
}: {
  data: {
    lintersPopular: Prisma.LinterGetPayload<{ include: { package: true } }>[];
  };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <section className="bg-gray-800 text-white">
        <div className="container mx-auto py-20 px-8 md:px-0 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-left">
            Real-time coding feedback and fixes powered by AI
          </h1>
          <p className="text-xl sm:text-2xl mb-8">
            Take your adoption of linting to the next level.
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
                  {lintersPopular.map((l) => (
                    <TableRow key={l.package.name}>
                      <TableCell scope="col">{l.package.name}</TableCell>
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
            Lint coverage scanner
          </h1>
          <p className="text-xl sm:text-2xl mb-8">
            Identify codebases missing lint coverage and gain unique quality
            insights.
          </p>
          <Link
            href="/waitlist"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Waitlist
          </Link>
        </div>
      </section>

      <section className=" bg-gray-100 text-black ">
        <div className="container mx-auto py-20 px-8 md:px-0  max-w-3xl ">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Concept recommendations
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-gray-700">
            Automated suggestions of ideas for new lint rules tailored to your
            team&apos;s codebases or consumers of your libraries.
          </p>
          <Link
            href="/waitlist"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Waitlist
          </Link>
        </div>
      </section>

      <section className="bg-gray-800 text-white ">
        <div className="container mx-auto py-20 px-8 md:px-0  max-w-3xl ">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Low-code lint builder
          </h1>
          <p className="text-xl sm:text-2xl mb-8">
            Design and build linting in a no-code or low-code fashion.
          </p>
          <Link
            href="/waitlist"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Waitlist
          </Link>
        </div>
      </section>

      <section className=" bg-gray-100 text-black ">
        <div className="container mx-auto py-20 px-8 md:px-0  max-w-3xl ">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Automated pull requests
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-gray-700">
            We&apos;ll open PRs to enable and fix relevant lint coverage gaps
            for you.
          </p>
          <Link
            href="/waitlist"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Waitlist
          </Link>
        </div>
      </section>

      <section className="bg-gray-800 text-white ">
        <div className="container mx-auto pt-20  max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight px-8 md:px-0">
            Why use linting?
          </h1>
          <div className="pt-6 pb-20  px-8 md:px-0  flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-semibold">Improve app quality</h2>
              <p className="mt-4 ">
                Automatically enforce best practices and detect common mistakes,
                reducing bugs and improving product reliability.
              </p>
            </div>
            <div className="md:w-1/3">
              <h2 className="text-2xl font-semibold ">
                Boost developer productivity
              </h2>
              <p className="mt-4 ">
                Supercharge your workflow with instant feedback and shorter
                development cycles.
              </p>
            </div>

            <div className="md:w-1/3 ">
              <h2 className="text-2xl font-semibold ">
                Keep your app modern and up-to-date
              </h2>
              <p className="mt-4">
                Detect and automatically fix usage of deprecated syntax to
                facilitate dependency, framework, and language upgrades and
                security patches.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
