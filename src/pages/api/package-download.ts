/**
 * TODO: This would be better as an independent package which enables bulk downloading, executing, loading of npm packages.
 * TODO: Installing and loading third-party packages is a security risk. We should consider using a sandbox.
 */

import {
  downloadAndLoad,
  searchDownloadAndLoad,
} from '../../utils/package-downloading';
import path from 'node:path';
import {
  CORE_LINTING_FRAMEWORKS,
  PLUGINS_SUPPORTED,
} from '../../utils/normalize';
import { NextApiRequest, NextApiResponse } from 'next';
import { env } from '@/env.mjs';

/**
 * Download the linters/packages locally.
 */
export default async function packageDownload(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (env.NODE_ENV !== 'development') {
    res.status(404).end();
    return;
  }

  const downloadPath = path.join(
    process.cwd(),
    'src',
    'pages',
    'api',
    'tmp',
    'npm',
  );

  let countPackagesDownloadedOfPlugins = 0;
  let countPackagesDownloadedOfFrameworks = 0;

  for (const searchText of PLUGINS_SUPPORTED) {
    const packagesLoaded = await searchDownloadAndLoad<unknown>(
      searchText,
      path.join(downloadPath, searchText),
    );
    console.log(packagesLoaded);
    console.log(
      `Loaded ${Object.keys(packagesLoaded).length} packages (plugins)`,
    );
    countPackagesDownloadedOfPlugins = Object.keys(packagesLoaded).length;
  }

  for (const pkg of CORE_LINTING_FRAMEWORKS) {
    const packagesLoaded = await downloadAndLoad<unknown>(
      pkg,
      path.join(downloadPath, pkg),
    );
    console.log(packagesLoaded);
    console.log(
      `Loaded ${Object.keys(packagesLoaded).length} packages (frameworks)`,
    );
    countPackagesDownloadedOfFrameworks = Object.keys(packagesLoaded).length;
  }

  res.status(200).json({
    countPackagesDownloadedOfPlugins,
    countPackagesDownloadedOfFrameworks,
  });
}
