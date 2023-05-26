import pacote from 'pacote';
import fetch from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

type NpmSearchResult = {
  objects: { package: { name: string; version: string } }[];
};

async function downloadPackage(
  packageName: string,
  version: string,
  downloadPath: string
): Promise<void> {
  const packageDir = path.join(downloadPath, packageName, version);

  // Create a directory for the package if it doesn't exist
  if (fs.existsSync(packageDir)) {
    console.log(`Already downloaded: ${packageName}@${version}`);
  } else {
    fs.mkdirSync(packageDir, { recursive: true });

    await pacote.extract(`${packageName}@${version}`, packageDir);
    console.log(`Package downloaded successfully: ${packageName}@${version}`);
  }
}

async function downloadPackages(
  searchText: string,
  downloadPath: string
): Promise<void> {
  const data = await downloadJSON<NpmSearchResult>(
    `https://registry.npmjs.org/-/v1/search?text=${searchText}&size=1000`
  );
  for (const pkg of data.objects) {
    await downloadPackage(pkg.package.name, pkg.package.version, downloadPath);
  }
}

async function downloadJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download JSON file. Status: ${response.status}. URL: ${url}`
    );
  }

  const data = (await response.json()) as T;
  return data;
}

const keyword = 'eslint-plugin';
const downloadPath = path.join(__dirname, '..', 'tmp', 'npm-packages');

await downloadPackages(keyword, downloadPath);
