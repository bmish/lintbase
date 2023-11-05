import { env } from '@/env.mjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/server/db';

export default async function deleteSummariesLinters(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  const linters = await prisma.linter.updateMany({
    data: {
      descriptionAI: null,
    },
  });

  res.status(200).json({ summarized: linters.count });
}
