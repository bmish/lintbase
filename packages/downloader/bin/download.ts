import { searchPackages, loadPackages, installPackages } from '../lib/utils.js';
import path from 'node:path';
import url from 'node:url';
import type { TSESLint } from '@typescript-eslint/utils';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const keyword = 'eslint-plugin';
const downloadPath = path.join(__dirname, '..', 'tmp', 'npm-packages');

const packageInfos = await searchPackages(keyword);

await installPackages(packageInfos, downloadPath);

const packagesLoaded = loadPackages<TSESLint.Linter.Plugin>(
  packageInfos,
  downloadPath
);

const packagesLoadedEntries = Object.entries(packagesLoaded).map(
  ([name, pkg]) => `${name}: ${Object.keys(pkg.rules || {}).length} rules`
);

console.log(packagesLoadedEntries);
console.log(`Loaded ${packagesLoadedEntries.length} packages`);
