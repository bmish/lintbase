import { env } from '@/env.mjs';
import { deleteAllData } from '@/utils/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function deleteAll(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  await deleteAllData();
  res.status(200).json({ deleted: true });
}
