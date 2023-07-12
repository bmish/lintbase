import { prisma } from '@/server/db';
import React from 'react';
import { fixAnyDatesInObject } from '@/utils/normalize';
import { Prisma } from '@prisma/client';
import DatabaseNavigation from '@/components/DatabaseNavigation';
import Head from 'next/head';
import Footer from '@/components/Footer';
import LintFrameworkTable from '@/components/LintFrameworkTable';
import { Paper } from '@mui/material';

const include = {
  linter: { include: { package: true } },
  ecosystem: true,
};

export async function getServerSideProps({ query }: { query: { q: string } }) {
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
      })
    )
  );

  const linterCountPerLintFramework = await Promise.all(
    lintFrameworks.map((lintFramework) =>
      prisma.linter.count({
        where: {
          lintFrameworkId: lintFramework.id,
          OR: [{ rules: { some: {} } }, { configs: { some: {} } }], // Actual linter with rules or configs.
        },
      })
    )
  );

  const lintFrameworksFixed = lintFrameworks.map((linter) =>
    fixAnyDatesInObject(linter)
  );

  return {
    props: {
      data: {
        lintFrameworksAndRuleCounts: lintFrameworksFixed.map(
          (lintFramework, index) => ({
            lintFramework,
            countRules: ruleCountPerLintFramework[index],
            countLinters: linterCountPerLintFramework[index],
          })
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
  const lintFrameworksPopulated = lintFrameworksAndRuleCounts.filter(
    (lintFrameworkAndRuleCount) => lintFrameworkAndRuleCount.countLinters > 1
  );

  const lintFrameworksPreview = lintFrameworksAndRuleCounts.filter(
    (lintFrameworkAndRuleCount) => lintFrameworkAndRuleCount.countLinters <= 1
  );

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase Linters</title>
        <meta property="og:title" content="LintBase Linters" key="title" />
      </Head>
      <DatabaseNavigation />
      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        {lintFrameworksPopulated.length > 0 && (
          <Paper>
            <LintFrameworkTable
              lintFrameworks={lintFrameworksPopulated.map(
                (obj) => obj.lintFramework
              )}
              ruleCounts={lintFrameworksPopulated.map((obj) => obj.countRules)}
              linterCounts={lintFrameworksPopulated.map(
                (obj) => obj.countLinters
              )}
            />
          </Paper>
        )}

        {lintFrameworksPreview.length > 0 && (
          <div>
            <h2 className="text-lg mt-8 text-center">Coming Soon</h2>
            <Paper className="mt-8">
              <LintFrameworkTable
                lintFrameworks={lintFrameworksPreview.map(
                  (obj) => obj.lintFramework
                )}
                ruleCounts={lintFrameworksPopulated.map(
                  (obj) => obj.countRules
                )}
                linterCounts={lintFrameworksPopulated.map(
                  (obj) => obj.countLinters
                )}
                isPreview={true}
              />
            </Paper>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
