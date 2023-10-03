import { env } from '@/env.mjs';
import { summarizeLinter } from '@/utils/summarize';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/server/db';
import { Prisma } from '@prisma/client';

const LIMIT = 25; // Only summarize top linters now due to cost.

export default async function summarizeLinters(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  const linters = await prisma.linter.findMany({
    include: { rules: true, configs: true, package: true },
    take: LIMIT,
    orderBy: {
      package: {
        countWeeklyDownloads: Prisma.SortOrder.desc,
      },
    },
  });

  for (const linter of linters) {
    const descriptionAI = await summarizeLinter(linter);

    await prisma.linter.update({
      where: { id: linter.id },
      data: { descriptionAI },
    });
  }

  res.status(200).json({ summarized: linters.length });
}
