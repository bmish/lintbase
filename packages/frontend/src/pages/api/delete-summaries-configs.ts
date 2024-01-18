import { env } from '@/env.mjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/server/db';

/**
 * Delete summaries of configs.
 * Mainly used for testing.
 */
export default async function deleteSummariesConfigs(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  const configs = await prisma.config.updateMany({
    data: {
      descriptionAI: null,
    },
  });

  res.status(200).json({ summarized: configs.count });
}
