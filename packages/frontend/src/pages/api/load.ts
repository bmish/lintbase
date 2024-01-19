import { loadLintersToDb } from '@/utils/normalize';
import { NextApiRequest, NextApiResponse } from 'next';
import { env } from '@/env.mjs';
// @ts-expect-error -- no types from eslint
import { builtinRules } from 'eslint/use-at-your-own-risk'; // Workaround from https://eslint.org/docs/latest/use/migrate-to-8.0.0#-the-cliengine-class-has-been-removed

// TODO: when running, temporarily uncomment these lines (they must be commented out in production).
// import etlRules from '../../../../downloader/tmp/npm/ember-template-lint/node_modules/ember-template-lint/lib/rules/index.js';
// import etlConfigurations from '../../../../downloader/tmp/npm/ember-template-lint/node_modules/ember-template-lint/lib/config/index.js';

/**
 * Load the linters/packages downloaded locally by the @lintbase/downloader into the database.
 */
export default async function load(req: NextApiRequest, res: NextApiResponse) {
  if (env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  // Comment these out when uncommenting the corresponding imports above.
  const etlRules = {};
  const etlConfigurations = {};

  const lintersCreated = await loadLintersToDb(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- no types from eslint
    Object.fromEntries(builtinRules.entries()), // Convert from LazyLoadingRuleMap to standard object.
    { rules: etlRules, configurations: etlConfigurations },
  );
  res.status(200).json({ linterCreatedCount: lintersCreated.length });
}
