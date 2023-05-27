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
    version: pkg.package.version,
  }));

  const packageJson = {
    dependencies: Object.fromEntries(
      packagesAndVersions.map((pkg) => [pkg.name, `^${pkg.version}`])
    ),
  };

  fs.mkdirSync(downloadPath, { recursive: true });
  fs.writeFileSync(
    path.join(downloadPath, 'package.json'),
    JSON.stringify(packageJson)
  );

  try {
    await execP(`npm install --prefix ${downloadPath} -f`);
  } catch (error) {
    console.error(`Failed to npm install. Error: ${String(error)}`);
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

const packagesLoad = packages.flatMap((pkg) => {
  const packagePath = path.join(downloadPath, 'node_modules', pkg.name);
  if (!fs.existsSync(packagePath)) {
    console.log(`No package.json found for ${pkg.name}@${pkg.version}`);

    return [];
  }

  try {
    // eslint-disable-next-line import/no-dynamic-require
    const loaded = require(packagePath) as {
      name: string;
      rules?: Record<string, unknown>[];
      configs?: Record<string, unknown>[];
    };
    loaded.name = pkg.name;
    return [loaded];
  } catch (error) {
    console.log(`Failed to require: ${packagePath}. Error = ${String(error)}`);
  }

  return [];
});

console.log(
  packagesLoad.map(
    (pkg) => `${pkg.name}: ${Object.keys(pkg.rules || {}).length} rules`
  )
);
console.log(`Loaded ${packagesLoad.length} packages`);
