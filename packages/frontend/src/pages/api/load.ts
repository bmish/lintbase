import { loadPluginsToDb } from '@/utils/normalize';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function load(req: NextApiRequest, res: NextApiResponse) {
  const pluginsCreated = await loadPluginsToDb();
  res.status(200).json({ pluginCreatedCount: pluginsCreated.length });
}
