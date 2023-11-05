import { env } from '@/env.mjs';
import { Octokit } from 'octokit';
import pLimit from 'p-limit';
import { PackageJson } from 'type-fest';

function getGitHubInfoFromUrlOrShortcut(
  urlOrShortcut: string,
): { owner: string; repo: string } | undefined {
  // Check for this format: github:user/repo or github.com:user/repo
  const regexShortcut = /github(?:.com)?:([^/]+)\/([^/]+)/u;
  const matchShortcut = urlOrShortcut.match(regexShortcut);
  if (matchShortcut) {
    return {
      owner: matchShortcut[1],
      repo: matchShortcut[2],
    };
  }

  // Check for github url.
  // Ignore any anchor (#) or query params (?) at end.
  const regexUrl = /github\.com\/([^/]+)\/([^/#?]+)/u;
  const matchUrl = urlOrShortcut.replace('.git', '').match(regexUrl);
  if (matchUrl) {
    return {
      owner: matchUrl[1],
      repo: matchUrl[2],
    };
  }
  return undefined;
}

function findGitHubInfoFromPackageJson(
  packageJson: PackageJson,
): { repo: string; owner: string } | undefined {
  const candidates: string[] = []; // In order of priority.

  if (typeof packageJson.repository === 'string') {
    candidates.push(packageJson.repository);
  } else if (
    typeof packageJson.repository === 'object' &&
    typeof packageJson.repository.url === 'string'
  ) {
    candidates.push(packageJson.repository.url);
  }
  if (packageJson.homepage) {
    candidates.push(packageJson.homepage);
  }
  if (typeof packageJson.bugs === 'string') {
    candidates.push(packageJson.bugs);
  } else if (
    typeof packageJson.bugs === 'object' &&
    typeof packageJson.bugs.url === 'string'
  ) {
    candidates.push(packageJson.bugs.url);
  }

  const matchingCandidate = candidates.find(
    (candidate) => getGitHubInfoFromUrlOrShortcut(candidate) !== undefined,
  );

  return matchingCandidate
    ? getGitHubInfoFromUrlOrShortcut(matchingCandidate)
    : undefined;
}

async function getRepository(octokit: Octokit, owner: string, repo: string) {
  const result = await octokit.rest.repos.get({
    owner,
    repo,
  });
  return result;
}

// TODO: can we get this type without using the return type of the function?
export type Repository = Awaited<ReturnType<typeof getRepository>>['data'];

export async function getRepositories(
  repos: readonly { owner: string; repo: string }[],
): Promise<Record<string, Repository | undefined>> {
  // Rate-limit to avoid hitting github's rate limit.
  const limit = pLimit(10);

  const octokit = new Octokit({
    auth: env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });

  const info = await Promise.all(
    repos.map(({ repo, owner }) =>
      limit(async () => {
        try {
          console.log(`Fetching GitHub info for: ${owner}/${repo}`); // eslint-disable-line no-console
          const result = await getRepository(octokit, owner, repo);
          return result;
        } catch {
          console.log(`Fetching GitHub info failed for ${owner}/${repo}.`); // eslint-disable-line no-console
          return undefined; // eslint-disable-line unicorn/no-useless-undefined
        }
      }),
    ),
  );

  return Object.fromEntries(
    repos.flatMap(({ owner, repo }, i) => {
      const item = info[i];
      if (!item) {
        return [];
      }
      return [[`${owner}/${repo}`, item.data]];
    }),
  );
}

export function packagesToGitHubInfo(
  packageToPackageJson: Record<string, PackageJson>,
): Record<string, { repo: string; owner: string }> {
  return Object.fromEntries(
    Object.entries(packageToPackageJson).flatMap(
      ([packageName, packageJson]) => {
        if (!packageJson) {
          return [];
        }
        const gitHubInfo = findGitHubInfoFromPackageJson(
          packageToPackageJson[packageName],
        );
        if (!gitHubInfo) {
          return [];
        }
        return [[packageName, gitHubInfo]];
      },
    ),
  );
}
