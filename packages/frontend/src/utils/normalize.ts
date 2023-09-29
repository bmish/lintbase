import { EmberTemplateLint, Stylelint, StylelintPlugin } from '@/utils/types';
import { load } from '@lintbase/downloader';
import type { TSESLint } from '@typescript-eslint/utils';
import path from 'node:path';
import { PackageJson } from 'type-fest';
import { readFileSync } from 'node:fs';
import { prisma } from '../server/db';
import {
  getAllNamedOptions,
  getPluginPrefix,
  normalizeFixable,
  ruleEntryToStringSeverity,
} from './eslint';
import { Prisma } from '@prisma/client';
import { asArray, uniqueItems } from './javascript';
import pLimit from 'p-limit';

const LIMIT_LINTERS_PER_FRAMEWORK = Number.MAX_SAFE_INTEGER; // Useful for partial loading during testing.

const IGNORED_KEYWORDS = new Set([
  'configs',
  'configuration',
  'configurations',
  'lint',
  'linter',
  'linter',
  'linting',
  'package',
  'plugin',
  'plugins',
  'rule',
  'rules',
]);

const ESLINT_IGNORED_KEYWORDS = new Set([
  ...IGNORED_KEYWORDS,
  'eslint',
  'eslint-plugin',
  'eslintplugin',
  'eslint-config',
  'eslintconfig',
  'eslint-configs',
  'eslintconfigs',
]);

const EMBER_TEMPLATE_LINT_IGNORED_KEYWORDS = new Set([
  ...IGNORED_KEYWORDS,
  'ember-template-lint',
  'ember-template-lint-plugin',
  'ember-template-lint-config',
  'ember-template-lint-configs',
  'ember-template-lint-configurations',
  'ember-template-lint-configuration',
  'ember-template-lint-configurations',
]);

// Keep in sync with: packages/downloader/bin/download.ts
const CORE_LINTING_FRAMEWORKS = [
  'ember-template-lint',
  'eslint',
  'markdownlint',
  'npm-package-json-lint',
  'stylelint',
];

// Keep in sync with: packages/downloader/bin/download.ts
const PLUGINS_SUPPORTED = [
  'eslint-plugin',
  'ember-template-lint-plugin',
  'stylelint-plugin',
];

type NpmRegistryInfo = {
  time: Record<string | 'created' | 'modified', string>;
  'dist-tags'?: Record<string, string> & { latest?: string; next?: string };
};

const linterInclude = {
  rules: {
    include: {
      options: true,
      replacedBys: true,
    },
  },
  configs: true,
  package: {
    include: {
      keywords: true,
    },
  },
};
async function baseToNormalizedLinter(
  linterName: string,
  lintFrameworkId: number,
  ecosystemId: number,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo,
  rules: Prisma.RuleCreateWithoutLinterInput[],
  configs: Prisma.ConfigCreateWithoutLinterInput[],
  keywordsToIgnore: Set<string>
): Promise<
  Prisma.LinterGetPayload<{ include: typeof linterInclude }> | undefined
> {
  // Connect the lint framework to its core linter.
  let lintFrameworkForCore = {};
  if (CORE_LINTING_FRAMEWORKS.includes(linterName)) {
    lintFrameworkForCore = {
      lintFrameworkForCore: {
        connect: { id: lintFrameworkId },
      },
    };
  }

  const packageFound = await prisma.linter.findFirst({
    include: linterInclude,
    where: {
      package: {
        name: linterName,
        ecosystemId,
      },
    },
  });

  if (packageFound) {
    // Already exists.
    return packageFound;
  }

  const linterCreated = await prisma.linter.create({
    include: linterInclude,
    data: {
      package: {
        create: {
          ecosystemId,

          name: linterName,
          description: packageJson.description || null,

          // TODO: get real data from npm/github
          countPrs: Math.round(Math.random() * 100),
          countIssues: Math.round(Math.random() * 100),
          countStars: Math.round(Math.random() * 100),
          countWatching: Math.round(Math.random() * 100),
          countForks: Math.round(Math.random() * 100),
          countContributors: Math.round(Math.random() * 100),
          countWeeklyDownloads: npmDownloadsInfo.downloads,

          packageCreatedAt: new Date(npmRegistryInfo.time.created),
          packageUpdatedAt: new Date(npmRegistryInfo.time.modified),

          linkRepository:
            typeof packageJson.repository === 'object'
              ? packageJson.repository.url
              : typeof packageJson.repository === 'string'
              ? packageJson.repository
              : null,
          repositoryDirectory:
            typeof packageJson.repository === 'object'
              ? packageJson.repository.directory
              : null,

          linkHomepage: packageJson.homepage?.toString() || null,
          linkBugs:
            typeof packageJson.bugs === 'object'
              ? packageJson.bugs.url
              : typeof packageJson.bugs === 'string'
              ? packageJson.bugs
              : null,
          emailBugs:
            typeof packageJson.bugs === 'object'
              ? packageJson.bugs.email
              : null,

          keywords: {
            create: uniqueItems(packageJson.keywords || [])
              .filter((keyword) => !keywordsToIgnore.has(keyword))
              .map((keyword) => ({ name: keyword })),
          },

          versions: {
            create: Object.entries(npmRegistryInfo.time)
              .filter(([version, time], i) => {
                if (typeof time !== 'string') {
                  // eslint-disable-next-line no-console
                  console.log(
                    'Skipping version',
                    version,
                    'due to invalid time for package',
                    linterName
                  );
                  return false; // Skip when time is an object about being unpublished. TODO: mark as unpublished.
                }
                if (
                  // TODO: only get most recent versions for now. Too expensive when some linters have thousands of versions.
                  i < 10 ||
                  [
                    // Always get versions for some significant tags.
                    (npmRegistryInfo['dist-tags'] || {}).latest,
                    (npmRegistryInfo['dist-tags'] || {}).next,
                  ]
                    .filter((version) => version !== undefined)
                    .includes(version)
                ) {
                  return true;
                }
                return false;
              })
              .map(([version, time]) => ({
                version,
                publishedAt: new Date(time),
                tags: {
                  create: Object.entries(npmRegistryInfo['dist-tags'] || {})
                    .filter(([, tagVersion]) => version === tagVersion)
                    .map(([tag]) => ({ name: tag })),
                },
              })),
          },
        },
      },

      rules: { create: rules },

      configs: { create: configs },

      lintFramework: {
        connect: { id: lintFrameworkId },
      },

      ...lintFrameworkForCore,
    },
  });

  return linterCreated;
}

async function eslintLinterToNormalizedLinter(
  linterName: string,
  linter: TSESLint.Linter.Plugin,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo,
  lintFrameworkId: number,
  ecosystemId: number
): Promise<
  Prisma.LinterGetPayload<{ include: typeof linterInclude }> | undefined
> {
  const rules = Object.entries(linter?.rules || {}).flatMap(
    ([ruleName, rule]) => {
      if (typeof rule !== 'object') {
        // Deprecated, function-style rule.
        return [
          {
            name: ruleName,
            description: null,
            fixable: null,
            hasSuggestions: false,
            // @ts-expect-error -- TODO: null should be allowed for "type"
            type: null as 'suggestion' | 'problem' | 'layout',
            // @ts-expect-error -- type is missing for this property
            deprecated: rule.deprecated || false,
            replacedBys: { create: [] },
            category: null,
            options: {
              // @ts-expect-error -- type is missing for this property
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- type is missing for this property
              create: uniqueItems(getAllNamedOptions(rule.schema), 'name').map(
                (obj) => ({ name: obj.name, type: obj.type })
              ),
            },
            requiresTypeChecking: false,
            linkRuleDoc: null,
          },
        ];
      }

      const ruleNormalized = {
        name: ruleName,
        description: rule.meta?.docs?.description || null,
        fixable: normalizeFixable(rule.meta?.fixable),
        hasSuggestions: rule.meta?.hasSuggestions || false,
        type: rule.meta?.type || null,
        deprecated: rule.meta?.deprecated || false,
        replacedBys: {
          // asArray in case user has mistakenly added a string instead of an array.
          create: uniqueItems(asArray(rule.meta?.replacedBy))
            .filter((name) => typeof name === 'string')
            .map((name) => ({
              name,
            })),
        },

        category:
          // @ts-expect-error -- category not an official property
          typeof rule.meta?.docs?.category === 'string'
            ? // @ts-expect-error -- category not an official property
              rule.meta.docs.category
            : null, // Only accept strings. In rare case, a plugin provided this as an array.
        options: {
          create: uniqueItems(
            getAllNamedOptions(rule.meta?.schema),
            'name'
          ).map((obj) => ({ name: obj.name, type: obj.type })),
        },
        // @ts-expect-error -- requiresTypeChecking not an official property

        requiresTypeChecking: rule.meta?.requiresTypeChecking || false,
        linkRuleDoc: rule.meta?.docs?.url || null,
      };

      return [ruleNormalized];
    }
  );

  const configs = Object.entries(linter?.configs || {}).map(([configName]) => {
    const config = {
      name: configName,
    };

    return config;
  });

  const linterCreated = await baseToNormalizedLinter(
    linterName,
    lintFrameworkId,
    ecosystemId,
    packageJson,
    npmDownloadsInfo,
    npmRegistryInfo,
    rules,
    configs,
    ESLINT_IGNORED_KEYWORDS
  );

  if (!linterCreated) {
    return undefined;
  }

  const linterPrefix = getPluginPrefix(linterName);

  const existingRuleConfig = await prisma.ruleConfig.findFirst({
    where: {
      linterId: linterCreated.id,
    },
  });

  if (existingRuleConfig) {
    // Likely already created this plugin previously.
    return linterCreated;
  }

  await prisma.ruleConfig.createMany({
    data: Object.entries(linter?.configs || {}).flatMap(
      ([configName, config]) => {
        const configId = linterCreated.configs.find(
          (configCreated) => configCreated.name === configName
        )?.id;
        if (configId === undefined) {
          return [];
        }
        return Object.entries(config.rules || {}).flatMap(
          ([ruleName, ruleEntry]) => {
            const ruleId = linterCreated.rules.find(
              (ruleCreated) =>
                (linterPrefix
                  ? `${linterPrefix}/${ruleCreated.name}`
                  : ruleCreated.name) === ruleName
            )?.id;
            if (ruleId === undefined) {
              return [];
            }

            if (ruleEntry === undefined) {
              return [];
            }
            const severity = ruleEntryToStringSeverity(ruleEntry);
            if (severity === undefined) {
              // Should not happen.
              return [];
            }
            return [
              {
                severity,
                linterId: linterCreated.id,
                configId,
                ruleId,
              },
            ];
          }
        );
      }
    ),
  });

  return linterCreated;
}

async function emberTemplateLintLinterToNormalizedLinter(
  linterName: string,
  linter: EmberTemplateLint,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo,
  lintFrameworkId: number,
  ecosystemId: number
): Promise<
  Prisma.LinterGetPayload<{ include: typeof linterInclude }> | undefined
> {
  const rules = Object.entries(linter?.rules || {}).map(([ruleName]) => {
    const ruleNormalized = {
      name: ruleName,
      description: null, // TODO
      fixable: null, // TODO
      hasSuggestions: false, // Not supported.
      type: null, // Not supported.
      deprecated: false, // Not supported.
      category: null, // Not supported.
      requiresTypeChecking: false, // Not supported.
      linkRuleDoc: null, // TODO
    };

    return ruleNormalized;
  });

  const configs = Object.entries(linter?.configurations || {}).map(
    ([configName]) => {
      const config = {
        name: configName,
      };

      return config;
    }
  );

  const linterCreated = await baseToNormalizedLinter(
    linterName,
    lintFrameworkId,
    ecosystemId,
    packageJson,
    npmDownloadsInfo,
    npmRegistryInfo,
    rules,
    configs,
    EMBER_TEMPLATE_LINT_IGNORED_KEYWORDS
  );

  // TODO: create RuleConfigs

  return linterCreated;
}

async function stylelintToNormalizedLinter(
  linterName: string,
  linter: Stylelint,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo,
  lintFrameworkId: number,
  ecosystemId: number
): Promise<
  Prisma.LinterGetPayload<{ include: typeof linterInclude }> | undefined
> {
  const rules = Object.entries(linter?.rules || {}).map(([ruleName, rule]) => {
    const ruleNormalized = {
      name: ruleName,
      description: null, // TODO
      fixable: rule.meta?.fixable ? 'code' : null, // TODO: schema should support booleans
      hasSuggestions: false, // Not supported.
      type: null, // Not supported.
      deprecated: rule.meta?.deprecated || false,
      category: null, // Not supported.
      requiresTypeChecking: false, // Not supported.
      linkRuleDoc: rule.meta?.url || null,
    };

    return ruleNormalized;
  });

  const linterCreated = await baseToNormalizedLinter(
    linterName,
    lintFrameworkId,
    ecosystemId,
    packageJson,
    npmDownloadsInfo,
    npmRegistryInfo,
    rules,
    [],
    IGNORED_KEYWORDS
  );

  // TODO: create RuleConfigs

  return linterCreated;
}

async function stylelintPluginToNormalizedLinter(
  linterName: string,
  linter: StylelintPlugin,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo,
  lintFrameworkId: number,
  ecosystemId: number
): Promise<
  Prisma.LinterGetPayload<{ include: typeof linterInclude }> | undefined
> {
  const rules = linter?.map?.(({ ruleName, rule }) => {
    const ruleNormalized = {
      name: ruleName,
      description: null, // TODO
      fixable: rule.meta?.fixable ? 'code' : null, // TODO: schema should support booleans
      hasSuggestions: false, // Not supported.
      type: null, // Not supported.
      deprecated: rule.meta?.deprecated || false,
      category: null, // Not supported.
      requiresTypeChecking: false, // Not supported.
      linkRuleDoc: rule.meta?.url || null,
    };

    return ruleNormalized;
  });

  const linterCreated = await baseToNormalizedLinter(
    linterName,
    lintFrameworkId,
    ecosystemId,
    packageJson,
    npmDownloadsInfo,
    npmRegistryInfo,
    rules,
    [],
    IGNORED_KEYWORDS
  );

  // TODO: create RuleConfigs

  return linterCreated;
}

async function createObjectAsync<T>(
  keys: string[],

  create: (_key: string) => Promise<T>
): Promise<Record<string, T>> {
  const results = await Promise.all(keys.map((key) => create(key)));
  return Object.fromEntries(
    results.map((result, index) => [keys[index], result])
  );
}

function createLintFrameworks(ecosystemId: number) {
  return createObjectAsync(
    CORE_LINTING_FRAMEWORKS,
    async (lintFrameworkName) => {
      const result = await prisma.lintFramework.upsert({
        where: {
          name_ecosystemId: {
            name: lintFrameworkName,
            ecosystemId,
          },
        },
        create: {
          name: lintFrameworkName,
          ecosystemId,
        },
        update: {},
      });
      return result;
    }
  );
}

export async function loadLintersToDb(
  eslintRules: Record<
    string,
    | TSESLint.RuleCreateFunction
    | TSESLint.RuleModule<string, unknown[], TSESLint.RuleListener>
  >
) {
  const linterTypes = [...CORE_LINTING_FRAMEWORKS, ...PLUGINS_SUPPORTED];

  // Ecosystems.
  const ecosystemNode = await prisma.ecosystem.upsert({
    where: { name: 'node' },
    create: {
      name: 'node',
      description:
        'Node.js is an open-source, cross-platform JavaScript runtime environment.',
      linkRepository: 'https://github.com/nodejs/node',
      linkHomepage: 'https://nodejs.org/',
    },
    update: {},
  });

  // Lint frameworks.
  const lintFrameworks = await createLintFrameworks(ecosystemNode.id);
  const lintersCreated = [];

  for (const linterType of linterTypes) {
    const downloadPath = path.join(
      process.cwd(),
      '..',
      'downloader',
      'tmp',
      'npm',
      linterType
    );

    let linterRecord;

    switch (linterType) {
      case 'eslint-plugin': {
        linterRecord = load<TSESLint.Linter.Plugin>(downloadPath);
        break;
      }
      case 'ember-template-lint-plugin': {
        linterRecord = load<EmberTemplateLint>(downloadPath);
        break;
      }
      case 'ember-template-lint': {
        linterRecord = load<EmberTemplateLint>(downloadPath);
        break;
      }
      case 'eslint': {
        linterRecord = load<TSESLint.Linter.Plugin>(downloadPath);

        if (!linterRecord.eslint) {
          throw new Error('Failed to load eslint.');
        }

        // Rules/configs are not exported like they are with linters. Have to manually retrieve them.
        linterRecord.eslint.rules = eslintRules;

        // ESLint core rules have a `recommended` property that we can build the config from.
        linterRecord.eslint.configs = {
          recommended: {
            rules: Object.fromEntries(
              Object.entries(linterRecord.eslint.rules).map(
                ([ruleName, rule]) => [
                  ruleName,
                  typeof rule === 'object'
                    ? rule.meta.docs?.recommended
                      ? 'error'
                      : undefined
                    : undefined,
                ]
              )
            ),
          },
        };

        break;
      }
      default: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        linterRecord = load<any>(downloadPath);
      }
    }

    // Rate-limit to avoid hitting npm's rate limit.
    const limitNpm = pLimit(10);

    const npmInfo = await Promise.all(
      Object.keys(linterRecord)
        .slice(0, LIMIT_LINTERS_PER_FRAMEWORK)
        .map((linterName) =>
          limitNpm(async () => {
            let npmDownloadsInfo;
            let npmRegistryInfo;

            console.log('Fetching npm info for', linterName); // eslint-disable-line no-console
            try {
              // Get info from npm registry.
              // https://github.com/npm/registry/blob/master/docs/download-counts.md
              // TODO: consider using bulk queries to reduce number of requests.
              npmDownloadsInfo = (await fetch(
                `https://api.npmjs.org/downloads/point/last-week/${linterName}`
              ).then((res) => res.json())) as
                | { downloads: number }
                | { error: string };

              npmRegistryInfo = (await fetch(
                `https://registry.npmjs.org/${linterName}`
              ).then((res) => res.json())) as NpmRegistryInfo;
            } catch {
              console.log(`Fetching npm info failed for ${linterName}.`); // eslint-disable-line no-console
              return {};
            }
            return {
              npmDownloadsInfo: {
                downloads:
                  'downloads' in npmDownloadsInfo
                    ? npmDownloadsInfo.downloads
                    : 0,
              },
              npmRegistryInfo,
            };
          })
        )
    );

    const lintersCreatedForThisType = await Promise.all(
      Object.entries(linterRecord)
        .slice(0, LIMIT_LINTERS_PER_FRAMEWORK)
        .flatMap(async ([linterName, linter], index) => {
          const pathPackageJson = path.join(
            downloadPath,
            'node_modules',
            linterName,
            'package.json'
          );
          const packageJson = JSON.parse(
            readFileSync(pathPackageJson, { encoding: 'utf8' })
          ) as PackageJson;

          const { npmDownloadsInfo, npmRegistryInfo } = npmInfo[index];
          if (!npmDownloadsInfo || !npmRegistryInfo) {
            console.log(`Skipping ${linterName} due to missing npm info.`); // eslint-disable-line no-console
            return [];
          }

          let linterNormalized;
          switch (linterType) {
            case 'eslint':
            case 'eslint-plugin': {
              linterNormalized = await eslintLinterToNormalizedLinter(
                linterName,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                linter,
                packageJson,
                npmDownloadsInfo,
                npmRegistryInfo,
                lintFrameworks.eslint.id,
                ecosystemNode.id
              );
              break;
            }

            case 'ember-template-lint':
            case 'ember-template-lint-plugin': {
              linterNormalized =
                await emberTemplateLintLinterToNormalizedLinter(
                  linterName,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  linter,
                  packageJson,
                  npmDownloadsInfo,
                  npmRegistryInfo,
                  lintFrameworks['ember-template-lint'].id,
                  ecosystemNode.id
                );
              break;
            }

            case 'stylelint': {
              linterNormalized = await stylelintToNormalizedLinter(
                linterName,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                linter,
                packageJson,
                npmDownloadsInfo,
                npmRegistryInfo,
                lintFrameworks.stylelint.id,
                ecosystemNode.id
              );
              break;
            }
            case 'stylelint-plugin': {
              linterNormalized = await stylelintPluginToNormalizedLinter(
                linterName,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                linter,
                packageJson,
                npmDownloadsInfo,
                npmRegistryInfo,
                lintFrameworks.stylelint.id,
                ecosystemNode.id
              );
              break;
            }

            default: {
              linterNormalized = await baseToNormalizedLinter(
                linterName,
                lintFrameworks[linterType].id,
                ecosystemNode.id,
                packageJson,
                npmDownloadsInfo,
                npmRegistryInfo,
                [],
                [],
                EMBER_TEMPLATE_LINT_IGNORED_KEYWORDS
              );
            }
          }

          if (!linterNormalized) {
            return [];
          }

          return [linterNormalized];
        })
    );

    lintersCreated.push(...lintersCreatedForThisType);
  }

  return lintersCreated;
}

export function fixAnyDatesInObject(object: object): object {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
      if (value instanceof Date) {
        return [key, value.toISOString()]; // Since DataTime can't be serialized by next.
      }

      if (Array.isArray(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return [key, value.map((item) => fixAnyDatesInObject(item))];
      }

      if (typeof value === 'object' && value !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return [key, fixAnyDatesInObject(value)];
      }

      return [key, value];
    })
  );
}

/**
 * https://www.prisma.io/docs/concepts/components/prisma-client/crud#deleting-all-data-with-raw-sql--truncate
 */
export async function deleteAllData() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error }); // eslint-disable-line no-console
  }
}
