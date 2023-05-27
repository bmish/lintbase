import fetch from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { createRequire } from 'node:module';
import { exec } from 'node:child_process';
import util from 'node:util';

const execP = util.promisify(exec);

const require = createRequire(import.meta.url);

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

type NpmSearchResult = {
  objects: { package: { name: string; version: string } }[];
};

async function downloadPackages(
  searchText: string,
  downloadPath: string
): Promise<{ name: string; version: string }[]> {
  const data = await downloadJSON<NpmSearchResult>(
    `https://registry.npmjs.org/-/v1/search?text=${searchText}&size=1000`
  );

  const packagesAndVersions = data.objects.map((pkg) => ({
    name: pkg.package.name,
    version: pkg.package.version, // Unused.
  }));

  // TODO: try to batch install for performance.
  for (const pkg of packagesAndVersions.slice(0, 10)) {
    console.log(`Installing ${pkg.name}@${pkg.version}`);
    const command = `npm install ${pkg.name} --prefix ${downloadPath} -f`;

    try {
      await execP(command);
    } catch (error) {
      console.error(`Failed to install ${pkg.name}. Error: ${String(error)}`);
    }
  }

  return packagesAndVersions;
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

const packages = await downloadPackages(keyword, downloadPath);

console.log(
  packages.flatMap((pkg) => {
    // ignore if this package doesn't have package.json
    const packagePath = path.join(downloadPath, 'node_modules', pkg.name);
    if (!fs.existsSync(packagePath)) {
      console.log(`No package.json found for ${pkg.name}@${pkg.version}`);

      return [];
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, import/no-dynamic-require
      return require(packagePath);
    } catch (error) {
      console.log(
        `Failed to require: ${packagePath}. Error = ${String(error)}`
      );
    }

    return [];
  })
);
