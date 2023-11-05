import {
  getNodeEcosystem,
  updatePackageDeprecationReplacements as updatePackageDeprecationReplacementsHelper,
} from '@/utils/normalize';
import { NextApiRequest, NextApiResponse } from 'next';
import { env } from '@/env.mjs';
import { getServerAuthSession } from '@/server/auth';

export default async function updatePackageDeprecationReplacements(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  const isAdmin = session?.user.id && session?.user.id === env.ADMIN_GITHUB_ID;
  if (env.NODE_ENV !== 'development' && !isAdmin) {
    res.status(404).end();
    return;
  }

  const ecosystemNode = await getNodeEcosystem();
  const result = await updatePackageDeprecationReplacementsHelper(
    ecosystemNode.id,
  );

  res.status(200).json({ result });
}
