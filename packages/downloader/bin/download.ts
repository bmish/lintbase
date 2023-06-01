import { searchDownloadAndLoad } from '../lib/utils.js';
import url from 'node:url';
import path from 'node:path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const downloadPath = path.join(__dirname, '..', 'tmp', 'npm-packages');

const packagesLoaded = await searchDownloadAndLoad<unknown>(
  'eslint-plugin',
  downloadPath
);

console.log(packagesLoaded);
console.log(`Loaded ${Object.keys(packagesLoaded).length} packages`);
