import { deleteAllData } from '@/utils/normalize';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function deleteAll(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await deleteAllData();
  res.status(200).json({ deleted: true });
}
