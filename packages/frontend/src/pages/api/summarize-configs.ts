import { env } from '@/env.mjs';
import { summarizeConfig } from '@/utils/summarize';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/server/db';
import { Prisma } from '@prisma/client';

const LIMIT = 100; // Only summarize top configs now due to cost.

export default async function summarizeConfigs(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  const configs = await prisma.config.findMany({
    include: {
      linter: { include: { package: true } },
      ruleConfigs: { include: { rule: true } },
    },
    take: LIMIT,
    orderBy: {
      linter: {
        package: {
          countDownloadsThisWeek: Prisma.SortOrder.desc,
        },
      },
    },
    where: {
      name: {
        // Skip "all" config which typically just enables all rules.
        not: 'all',
      },
      ruleConfigs: {
        // Skip configs that don't have any rules.
        some: {},
      },
    },
  });

  for (const config of configs) {
    const descriptionAI = await summarizeConfig(config);

    await prisma.config.update({
      where: { id: config.id },
      data: { descriptionAI },
    });
  }

  res.status(200).json({ summarized: configs.length });
}
