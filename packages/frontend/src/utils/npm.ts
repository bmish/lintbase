import pLimit from 'p-limit';
import { PackageJson } from 'type-fest';

export type NpmRegistryInfo = {
  time: Record<string | 'created' | 'modified', string>;
  'dist-tags'?: Record<string, string> & { latest?: string; next?: string };
} & PackageJson;

export async function getNpmInfo(packageNames: readonly string[]): Promise<
  Record<
    string,
    | {
        npmDownloadsInfo?: {
          downloads: number;
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
        let npmDownloadsInfo;
        let npmRegistryInfo;

        console.log('Fetching npm info for', packageName); // eslint-disable-line no-console
        try {
          // Get info from npm registry.
          // https://github.com/npm/registry/blob/master/docs/download-counts.md
          // TODO: consider using bulk queries to reduce number of requests.
          npmDownloadsInfo = (await fetch(
            `https://api.npmjs.org/downloads/point/last-week/${packageName}`
          ).then((res) => res.json())) as
            | { downloads: number }
            | { error: string };

          npmRegistryInfo = await fetch(
            `https://registry.npmjs.org/${packageName}`
          ).then((res) => res.json());
        } catch {
          console.log(`Fetching npm info failed for ${packageName}.`); // eslint-disable-line no-console
          return {};
        }
        return {
          npmDownloadsInfo: {
            downloads:
              'downloads' in npmDownloadsInfo ? npmDownloadsInfo.downloads : 0,
          },
          npmRegistryInfo,
        };
      })
    )
  );

  return Object.fromEntries(
    packageNames.map((packageName, i) => [packageName, info[i]])
  );
}
