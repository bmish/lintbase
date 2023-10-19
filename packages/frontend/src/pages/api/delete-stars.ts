import { env } from '@/env.mjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/server/db';

export default async function deleteStars(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  const configs = await prisma.starredRepositories.deleteMany();

  res.status(200).json({ deleted: configs.count });
}
