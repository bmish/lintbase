/**
 * General utilities for npm and package.json.
 */

import pLimit from 'p-limit';
import { PackageJson } from 'type-fest';

export type NpmRegistryInfo = {
  time: Record<string | 'created' | 'modified', string>;
  'dist-tags'?: Record<string, string> & { latest?: string; next?: string };
  versions: Record<
    string,
    | {
        deprecated?: string;
        dist?: { unpackedSize?: number; fileCount?: number };
        engines: Record<string, string | undefined>;
        peerDependencies: Record<string, string | undefined>;
      }
    | undefined
  >;
} & PackageJson;

export function getUnpackedSize(
  registryInfo: NpmRegistryInfo,
): number | undefined {
  const { 'dist-tags': distTags, versions } = registryInfo;
  if (distTags?.latest) {
    const latestVersion = versions[distTags.latest];
    if (latestVersion?.dist?.unpackedSize) {
      return latestVersion.dist.unpackedSize;
    }
  }
  return undefined;
}

export function getEngines(
  registryInfo: NpmRegistryInfo,
): Record<string, string | undefined> | undefined {
  const { 'dist-tags': distTags, versions } = registryInfo;
  if (distTags?.latest) {
    const latestVersion = versions[distTags.latest];
    if (latestVersion?.engines) {
      return latestVersion.engines;
    }
  }
  return undefined;
}

export function getPeerDependencies(
  registryInfo: NpmRegistryInfo,
): Record<string, string | undefined> | undefined {
  const { 'dist-tags': distTags, versions } = registryInfo;
  if (distTags?.latest) {
    const latestVersion = versions[distTags.latest];
    if (latestVersion?.peerDependencies) {
      return latestVersion.peerDependencies;
    }
  }
  return undefined;
}

export function getFileCount(
  registryInfo: NpmRegistryInfo,
): number | undefined {
  const { 'dist-tags': distTags, versions } = registryInfo;
  if (distTags?.latest) {
    const latestVersion = versions[distTags.latest];
    if (latestVersion?.dist?.fileCount) {
      return latestVersion.dist.fileCount;
    }
  }
  return undefined;
}

export function getDeprecationMessage(
  registryInfo: NpmRegistryInfo,
): string | undefined {
  const { 'dist-tags': distTags, versions } = registryInfo;
  if (distTags?.latest) {
    const latestVersion = versions[distTags.latest];
    if (latestVersion?.deprecated) {
      return latestVersion.deprecated;
    }
  }
  return undefined;
}

function getDates() {
  const now = new Date();

  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );

  const daysAgo7 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7,
  );

  const daysAgo8 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 8,
  );

  const daysAgo14 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 14,
  );

  return {
    thisWeek: {
      begin: daysAgo7,
      end: yesterday,
    },
    lastWeek: {
      begin: daysAgo14,
      end: daysAgo8,
    },
  };
}

// return format like 2014-01-01
function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function fetchNpmDownloadCount(
  packageName: string,
  from: Date,
  to: Date,
) {
  // Get info from npm registry.
  // https://github.com/npm/registry/blob/master/docs/download-counts.md
  // TODO: consider using bulk queries to reduce number of requests.
  const url = `https://api.npmjs.org/downloads/point/${formatDate(
    from,
  )}:${formatDate(to)}/${packageName}`;
  const result = (await fetch(url).then((res) => res.json())) as
    | { downloads: number }
    | { error: string };
  return result;
}

export async function getNpmInfo(packageNames: readonly string[]): Promise<
  Record<
    string,
    | {
        npmDownloadsInfo?: {
          thisWeek: number;
          lastWeek: number;
        };
        npmRegistryInfo?: NpmRegistryInfo;
      }
    | undefined
  >
> {
  // Rate-limit to avoid hitting npm's rate limit.
  const limitNpm = pLimit(10);

  const info = await Promise.all(
    packageNames.map((packageName) =>
      limitNpm(async () => {
        let npmDownloadsInfoThisWeek;
        let npmDownloadsInfoLastWeek;
        let npmRegistryInfo;

        const dates = getDates();

        console.log('Fetching npm info for', packageName); // eslint-disable-line no-console
        try {
          npmDownloadsInfoThisWeek = await fetchNpmDownloadCount(
            packageName,
            dates.thisWeek.begin,
            dates.thisWeek.end,
          );

          npmDownloadsInfoLastWeek = await fetchNpmDownloadCount(
            packageName,
            dates.lastWeek.begin,
            dates.lastWeek.end,
          );

          // https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
          npmRegistryInfo = await fetch(
            `https://registry.npmjs.org/${packageName}`,
          ).then((res) => res.json());
        } catch {
          console.log(`Fetching npm info failed for ${packageName}.`); // eslint-disable-line no-console
          return {};
        }
        return {
          npmDownloadsInfo: {
            thisWeek:
              'downloads' in npmDownloadsInfoThisWeek
                ? npmDownloadsInfoThisWeek.downloads
                : 0,
            lastWeek:
              'downloads' in npmDownloadsInfoLastWeek
                ? npmDownloadsInfoLastWeek.downloads
                : 0,
          },
          npmRegistryInfo,
        };
      }),
    ),
  );

  return Object.fromEntries(
    packageNames.map((packageName, i) => [packageName, info[i]]),
  );
}

export function semverPretty(semver: string) {
  return semver.replaceAll('.0.0', '').replaceAll('.0', '');
}
