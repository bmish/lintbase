import { searchDownloadAndLoad } from '../lib/utils.js';
import url from 'node:url';
import path from 'node:path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const retrievals = ['eslint-plugin', 'ember-template-lint-plugin'];

const downloadPath = path.join(__dirname, '..', 'tmp', 'npm');

for (const searchText of retrievals) {
  if (searchText) {
    const packagesLoaded = await searchDownloadAndLoad<unknown>(
      searchText,
      path.join(downloadPath, searchText)
    );
    console.log(packagesLoaded);
    console.log(`Loaded ${Object.keys(packagesLoaded).length} packages`);
  }
}
