import {
  getNodeEcosystem,
  updatePackageDeprecationReplacements as updatePackageDeprecationReplacementsHelper,
} from '@/utils/normalize';
import { NextApiRequest, NextApiResponse } from 'next';
import { env } from '@/env.mjs';

export default async function updatePackageDeprecationReplacements(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  const ecosystemNode = await getNodeEcosystem();
  const result = await updatePackageDeprecationReplacementsHelper(
    ecosystemNode.id
  );

  res.status(200).json({ result });
}
