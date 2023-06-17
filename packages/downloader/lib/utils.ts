import fetch from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { exec } from 'node:child_process';
import util from 'node:util';

const execP = util.promisify(exec);

const require = createRequire(import.meta.url);

type PackageInfo = { name: string; version: string };

type NpmSearchResult = {
  objects: { package: PackageInfo }[];
};

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

async function searchPackages(searchText: string): Promise<PackageInfo[]> {
  const data = await downloadJSON<NpmSearchResult>(
    `https://registry.npmjs.org/-/v1/search?text=${searchText}&size=1000`
  );

  const packageInfos = data.objects.map((pkg) => ({
    name: pkg.package.name,
    version: pkg.package.version,
  }));

  return packageInfos;
}

async function installPackages(
  packageInfos: PackageInfo[],
  downloadPath: string
) {
  const packageJson = {
    dependencies: Object.fromEntries(
      packageInfos.map((pkg) => [
        pkg.name,
        pkg.version === 'latest' ? pkg.version : `^${pkg.version}`,
      ])
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
}

function loadPackages<T>(
  packages: PackageInfo[],
  downloadPath: string
): Record<string, T> {
  return Object.fromEntries(
    packages.flatMap((pkg) => {
      const packagePath = path.join(downloadPath, 'node_modules', pkg.name);
      if (!fs.existsSync(packagePath)) {
        console.log(`No package.json found for ${pkg.name}@${pkg.version}`);

        return [];
      }

      try {
        // eslint-disable-next-line import/no-dynamic-require
        const loaded = require(packagePath) as T;
        return [[pkg.name, loaded]];
      } catch (error) {
        console.log(
          `Failed to require: ${packagePath}. Error = ${String(error)}`
        );
      }

      return [];
    })
  );
}

export async function searchDownloadAndLoad<T>(
  searchText: string,
  downloadPath: string
) {
  const packageInfos = await searchPackages(searchText);

  await installPackages(packageInfos, downloadPath);

  return loadPackages<T>(packageInfos, downloadPath);
}

export function load<T>(downloadPath: string) {
  const packageJsonPath = path.join(downloadPath, 'package.json');
  const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, { encoding: 'utf8' })
  ) as { dependencies?: Record<string, string> };
  const packageInfos = Object.entries(packageJson.dependencies || {}).map(
    ([name, version]) => ({ name, version })
  );
  return loadPackages<T>(packageInfos, downloadPath);
}

export async function downloadAndLoad<T>(
  packageName: string,
  downloadPath: string
) {
  const packageInfos = [{ name: packageName, version: 'latest' }];

  await installPackages(packageInfos, downloadPath);

  return loadPackages<T>(packageInfos, downloadPath);
}
