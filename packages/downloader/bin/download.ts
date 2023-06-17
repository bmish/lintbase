import { downloadAndLoad, searchDownloadAndLoad } from '../lib/utils.js';
import url from 'node:url';
import path from 'node:path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const searches: string[] = ['eslint-plugin', 'ember-template-lint-plugin'];
const packages = ['eslint'];

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
