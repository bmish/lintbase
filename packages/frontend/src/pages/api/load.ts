import { loadPluginsToDb } from '@/utils/normalize';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function load(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  // TODO: temporary fix to prevent "module not found" error during Vercel deployment due to this import that only works locally.
  const eslintRules = {
    entries() {
      return [];
    },
  };
  // const { default: eslintRules } = await import(
  //   // @ts-expect-error -- ESLint doesn't have types.
  //   '../../../../downloader/tmp/npm/eslint/node_modules/eslint/lib/rules/index.js'
  // );

  const pluginsCreated = await loadPluginsToDb(
    Object.fromEntries(eslintRules.entries()) // Convert from LazyLoadingRuleMap to standard object.
  );
  res.status(200).json({ pluginCreatedCount: pluginsCreated.length });
}
