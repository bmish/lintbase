import { downloadAndLoad, searchDownloadAndLoad } from '../lib/utils.js';
import url from 'node:url';
import path from 'node:path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const searches: string[] = ['eslint-plugin', 'ember-template-lint-plugin'];

// Same as CORE_LINTING_FRAMEWORKS in packages/frontend/src/utils/normalize.ts.
const packages = [
  'ember-template-lint',
  'eslint',
  'markdownlint',
  'npm-package-json-lint',
  'stylelint',
];

const downloadPath = path.join(__dirname, '..', 'tmp', 'npm');

for (const searchText of searches) {
  const packagesLoaded = await searchDownloadAndLoad<unknown>(
    searchText,
    path.join(downloadPath, searchText)
  );
  console.log(packagesLoaded);
  console.log(`Loaded ${Object.keys(packagesLoaded).length} packages`);
}

for (const pkg of packages) {
  const packagesLoaded = await downloadAndLoad<unknown>(
    pkg,
    path.join(downloadPath, pkg)
  );
  console.log(packagesLoaded);
  console.log(`Loaded ${Object.keys(packagesLoaded).length} packages`);
}
