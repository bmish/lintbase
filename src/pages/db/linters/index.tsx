import { prisma } from '@/server/db';
import React from 'react';
import { fixAnyDatesInObject } from '@/utils/prisma';
import { Prisma } from '@prisma/client';
import DatabaseNavigation from '@/components/Database/DatabaseNavigation';
import Head from 'next/head';
import Footer from '@/components/Layout/Footer';
import LintFrameworkTable from '@/components/Table/LintFrameworkTable';
import { Paper } from '@mui/material';

const include = {
  linter: { include: { package: true } },
  ecosystem: true,
};

export async function getServerSideProps({ query }: { query: { q?: string } }) {
  // Access individual query parameters
  const { q } = query;

  const where = q
    ? {
        OR: [
          {
            name: {
              contains: q,
            },
          },
          {
            linter: {
              package: {
                description: {
                  contains: q,
                },
              },
            },
          },
        ],
      }
    : {};

  const [lintFrameworks] = await Promise.all([
    prisma.lintFramework.findMany({
      where,
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
      include,
    }),
  ]);

  // TODO: skip preview-only frameworks for performance.
  const ruleCountPerLintFramework = await Promise.all(
    lintFrameworks.map((lintFramework) =>
      prisma.rule.count({
        where: {
          linter: {
            lintFrameworkId: lintFramework.id,
          },
        },
      }),
    ),
  );

  const linterCountPerLintFramework = await Promise.all(
    lintFrameworks.map((lintFramework) =>
      prisma.linter.count({
        where: {
          lintFrameworkId: lintFramework.id,
          OR: [{ rules: { some: {} } }, { configs: { some: {} } }], // Actual linter with rules or configs.
        },
      }),
    ),
  );

  const lintFrameworksFixed = lintFrameworks.map((linter) =>
    fixAnyDatesInObject(linter),
  );

  return {
    props: {
      data: {
        lintFrameworksAndRuleCounts: lintFrameworksFixed.map(
          (lintFramework, index) => ({
            lintFramework,
            countRules: ruleCountPerLintFramework[index],
            countLinters: linterCountPerLintFramework[index],
          }),
        ),
      },
    },
  };
}

export default function Linters({
  data: { lintFrameworksAndRuleCounts },
}: {
  data: {
    lintFrameworksAndRuleCounts: {
      lintFramework: Prisma.LintFrameworkGetPayload<{
        include: typeof include;
      }>;
      countRules: number;
      countLinters: number;
    }[];
  };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>Lintbase Linters</title>
        <meta property="og:title" content="Lintbase Linters" key="title" />
      </Head>
      <DatabaseNavigation />
      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        {lintFrameworksAndRuleCounts.length > 0 && (
          <Paper>
            <LintFrameworkTable
              lintFrameworks={lintFrameworksAndRuleCounts.map(
                (obj) => obj.lintFramework,
              )}
              ruleCounts={lintFrameworksAndRuleCounts.map(
                (obj) => obj.countRules,
              )}
              linterCounts={lintFrameworksAndRuleCounts.map(
                (obj) => obj.countLinters,
              )}
            />
          </Paper>
        )}
        <Footer />
      </main>
    </div>
  );
}
