/**
 * TODO: This would be better as an independent package which enables bulk downloading, executing, loading of npm packages.
 * TODO: Installing and loading third-party packages is a security risk. We should consider using a sandbox.
 */

import { downloadAndLoad, searchDownloadAndLoad } from './utils.js';
import url from 'node:url';
import path from 'node:path';
import {
  CORE_LINTING_FRAMEWORKS,
  PLUGINS_SUPPORTED,
} from '../../src/utils/normalize.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const downloadPath = path.join(__dirname, 'tmp', 'npm');

for (const searchText of PLUGINS_SUPPORTED) {
  const packagesLoaded = await searchDownloadAndLoad<unknown>(
    searchText,
    path.join(downloadPath, searchText),
  );
  console.log(packagesLoaded);
  console.log(`Loaded ${Object.keys(packagesLoaded).length} packages`);
}

for (const pkg of CORE_LINTING_FRAMEWORKS) {
  const packagesLoaded = await downloadAndLoad<unknown>(
    pkg,
    path.join(downloadPath, pkg),
  );
  console.log(packagesLoaded);
  console.log(`Loaded ${Object.keys(packagesLoaded).length} packages`);
}
