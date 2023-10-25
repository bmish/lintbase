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
import { asArray, createObjectAsync, uniqueItems } from './javascript';
import {
  NpmRegistryInfo,
  getDeprecationMessage,
  getFileCount,
  getNpmInfo,
  getUnpackedSize,
} from './npm';
import { LINTERS_DEPRECATED, getLinteesForLinter } from './lintees';
import { getRepositories, packagesToGitHubInfo, Repository } from './github';

const LIMIT_LINTERS_PER_FRAMEWORK = Number.MAX_SAFE_INTEGER; // Useful for partial loading during testing.
const LIMIT_TO_SPECIFIC_LINTERS: readonly string[] = []; // Useful for partial loading during testing.

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

function createPackageObject(
  linterName: string,
  ecosystemId: number,
  npmDownloadsInfo: { lastWeek: number; thisWeek: number },
  npmRegistryInfo: NpmRegistryInfo,
  githubInfo: Repository | undefined,
  keywordsToIgnore: Set<string>,
  packageJsonLocal?: PackageJson // Only used when we actually downloaded the package locally.
): Prisma.PackageCreateInput {
  const result: Prisma.PackageCreateInput = {
    ecosystem: {
      connect: { id: ecosystemId },
    },

    name: linterName,
    description: npmRegistryInfo.description || null,

    countDownloadsThisWeek: npmDownloadsInfo.thisWeek,
    countDownloadsLastWeek: npmDownloadsInfo.lastWeek,
    countDownloadsWeekOverWeek:
      npmDownloadsInfo.thisWeek - npmDownloadsInfo.lastWeek,
    percentDownloadsWeekOverWeek: Math.round(
      ((npmDownloadsInfo.thisWeek - npmDownloadsInfo.lastWeek) /
        npmDownloadsInfo.lastWeek) *
        100
    ),

    packageCreatedAt: new Date(npmRegistryInfo.time.created),
    packageUpdatedAt: new Date(npmRegistryInfo.time.modified),

    license: npmRegistryInfo.license || null,
    sizeUnpacked: getUnpackedSize(npmRegistryInfo) ?? null,
    countFiles: getFileCount(npmRegistryInfo) ?? null,

    // Handle deprecations.
    // Note: deprecatedReplacements are filled in later after all the packages are already created.
    deprecated:
      getDeprecationMessage(npmRegistryInfo) !== undefined ||
      linterName in LINTERS_DEPRECATED,
    deprecatedReason: getDeprecationMessage(npmRegistryInfo),

    linkRepository:
      typeof npmRegistryInfo.repository === 'object'
        ? npmRegistryInfo.repository.url
        : typeof npmRegistryInfo.repository === 'string'
        ? npmRegistryInfo.repository
        : null,
    repositoryDirectory:
      typeof npmRegistryInfo.repository === 'object'
        ? npmRegistryInfo.repository.directory
        : null,

    linkHomepage: npmRegistryInfo.homepage?.toString() || null,
    linkBugs:
      typeof npmRegistryInfo.bugs === 'object'
        ? npmRegistryInfo.bugs.url
        : typeof npmRegistryInfo.bugs === 'string'
        ? npmRegistryInfo.bugs
        : null,
    emailBugs:
      typeof npmRegistryInfo.bugs === 'object'
        ? npmRegistryInfo.bugs.email
        : null,

    keywords: {
      create: uniqueItems(npmRegistryInfo.keywords || [])
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
              .includes(version) ||
            // Always get version downloaded locally.
            (packageJsonLocal && packageJsonLocal.version === version)
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
          isLoaded: packageJsonLocal && packageJsonLocal.version === version,
        })),
    },
  };

  if (githubInfo) {
    result.repository = {
      connectOrCreate: {
        where: {
          fullName: githubInfo.full_name,
        },
        create: {
          archived: githubInfo.archived,
          countForks: githubInfo.forks,
          countStargazers: githubInfo.stargazers_count,
          countWatchers: githubInfo.subscribers_count,
          defaultBranch: githubInfo.default_branch,
          description: githubInfo.description,
          disabled: githubInfo.disabled,
          fork: githubInfo.fork,
          fullName: githubInfo.full_name,
          githubCreatedAt: githubInfo.created_at,
          githubId: githubInfo.id,
          githubPushedAt: githubInfo.pushed_at,
          githubUpdatedAt: githubInfo.updated_at,
          language: githubInfo.language,
          name: githubInfo.name,
          private: githubInfo.private,
          size: githubInfo.size,
          urlClone: githubInfo.clone_url,
          urlGit: githubInfo.git_url,
          urlHomepage: githubInfo.homepage,
          urlHtml: githubInfo.html_url,
          urlSsh: githubInfo.ssh_url,
          visibility: githubInfo.visibility,
        },
      },
    };
  }

  return result;
}

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
  npmDownloadsInfo: { lastWeek: number; thisWeek: number },
  npmRegistryInfo: NpmRegistryInfo,
  githubInfo: Repository | undefined,
  rules: Prisma.RuleCreateWithoutLinterInput[],
  configs: Prisma.ConfigCreateWithoutLinterInput[],
  processors: Prisma.ProcessorCreateWithoutLinterInput[],
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

  const lintees = getLinteesForLinter(linterName);

  const linterCreated = await prisma.linter.create({
    include: linterInclude,
    data: {
      package: {
        create: createPackageObject(
          linterName,
          ecosystemId,
          npmDownloadsInfo,
          npmRegistryInfo,
          githubInfo,
          keywordsToIgnore,
          packageJson
        ),
      },

      rules: { create: rules },
      configs: { create: configs },
      processors: { create: processors },

      lintFramework: {
        connect: { id: lintFrameworkId },
      },

      ...lintFrameworkForCore,

      lintees: {
        connectOrCreate: lintees.map((lintee) => ({
          where: {
            name_ecosystemId: {
              name: lintee,
              ecosystemId,
            },
          },
          create: createPackageObject(
            lintee,
            ecosystemId,
            npmDownloadsInfo,
            npmRegistryInfo,
            githubInfo,
            keywordsToIgnore
          ),
        })),
      },
    },
  });

  return linterCreated;
}

async function eslintLinterToNormalizedLinter(
  linterName: string,
  linter: TSESLint.Linter.Plugin,
  packageJson: PackageJson,
  npmDownloadsInfo: { lastWeek: number; thisWeek: number },
  npmRegistryInfo: NpmRegistryInfo,
  githubInfo: Repository | undefined,
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
            schema: rule.schema,
            // @ts-expect-error -- type is missing for this property
            deprecated: rule.deprecated || false,
            replacedBys: { create: [] },
            category: null,
            options: {
              // @ts-expect-error -- type is missing for this property
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- type is missing for this property
              create: uniqueItems(getAllNamedOptions(rule.schema), 'name').map(
                (obj) => ({
                  name: obj.name,
                  type: obj.type,
                  description: obj.description,
                  required: obj.required,
                  choices: {
                    create: obj.enum?.map((obj) => ({ name: String(obj) })),
                  },
                  default:
                    obj.default === undefined ? undefined : String(obj.default),
                  deprecated: obj.deprecated,
                })
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
        schema: rule.meta?.schema,
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
          ).map((obj) => ({
            name: obj.name,
            type: obj.type,
            description: obj.description,
            required: obj.required,
            choices: {
              create: obj.enum?.map((obj) => ({ name: String(obj) })),
            },
            default:
              obj.default === undefined ? undefined : String(obj.default),
            deprecated: obj.deprecated,
          })),
        },
        // @ts-expect-error -- requiresTypeChecking not an official property

        requiresTypeChecking: rule.meta?.requiresTypeChecking || false,
        linkRuleDoc: rule.meta?.docs?.url || null,
      };

      return [ruleNormalized];
    }
  );

  const configs = Object.entries(linter?.configs || {}).map(
    ([configName, config]) => ({
      name: configName,
      // @ts-expect-error -- This is an unofficial config property.
      description: config.description,
    })
  );

  const processors = Object.entries(linter?.processors || {}).map(
    ([processorName, processor]) => ({
      name: processorName,
      // @ts-expect-error -- This is an unofficial processor property.
      description: processor.meta.description,
    })
  );

  const linterCreated = await baseToNormalizedLinter(
    linterName,
    lintFrameworkId,
    ecosystemId,
    packageJson,
    npmDownloadsInfo,
    npmRegistryInfo,
    githubInfo,
    rules,
    configs,
    processors,
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
  npmDownloadsInfo: { lastWeek: number; thisWeek: number },
  npmRegistryInfo: NpmRegistryInfo,
  githubInfo: Repository | undefined,
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
    githubInfo,
    rules,
    configs,
    [],
    EMBER_TEMPLATE_LINT_IGNORED_KEYWORDS
  );

  // TODO: create RuleConfigs

  return linterCreated;
}

async function stylelintToNormalizedLinter(
  linterName: string,
  linter: Stylelint,
  packageJson: PackageJson,
  npmDownloadsInfo: { lastWeek: number; thisWeek: number },
  npmRegistryInfo: NpmRegistryInfo,
  githubInfo: Repository | undefined,
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
    githubInfo,
    rules,
    [],
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
  npmDownloadsInfo: { lastWeek: number; thisWeek: number },
  npmRegistryInfo: NpmRegistryInfo,
  githubInfo: Repository | undefined,
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
    githubInfo,
    rules,
    [],
    [],
    IGNORED_KEYWORDS
  );

  // TODO: create RuleConfigs

  return linterCreated;
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

export async function getNodeEcosystem() {
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

  return ecosystemNode;
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
  const ecosystemNode = await getNodeEcosystem();

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

    // For testing purposes, limit linters.
    if (
      LIMIT_LINTERS_PER_FRAMEWORK !== Number.MAX_SAFE_INTEGER ||
      LIMIT_TO_SPECIFIC_LINTERS.length > 0
    ) {
      linterRecord = Object.fromEntries(
        Object.entries(linterRecord)
          .filter(([linterName]) => {
            if (LIMIT_TO_SPECIFIC_LINTERS.length > 0) {
              return LIMIT_TO_SPECIFIC_LINTERS.includes(linterName);
            }
            return true;
          })
          .slice(0, LIMIT_LINTERS_PER_FRAMEWORK)
      );
    }

    const linterNames = Object.keys(linterRecord);
    const npmInfo = await getNpmInfo([
      ...linterNames,
      ...linterNames.flatMap((linterName) => getLinteesForLinter(linterName)),
    ]);
    const packageToPackageJson = Object.fromEntries(
      Object.entries(npmInfo).flatMap(([packageName, npmInfo]) => {
        if (!npmInfo?.npmRegistryInfo) {
          return [];
        }
        return [[packageName, npmInfo.npmRegistryInfo]];
      })
    );
    const githubRepoNames = packagesToGitHubInfo(packageToPackageJson);
    const githubInfo = await getRepositories(Object.values(githubRepoNames));

    const lintersCreatedForThisType = await Promise.all(
      Object.entries(linterRecord).flatMap(async ([linterName, linter]) => {
        const pathPackageJson = path.join(
          downloadPath,
          'node_modules',
          linterName,
          'package.json'
        );
        const packageJson = JSON.parse(
          readFileSync(pathPackageJson, { encoding: 'utf8' })
        ) as PackageJson;

        const { npmDownloadsInfo, npmRegistryInfo } = npmInfo[linterName] || {};
        if (!npmDownloadsInfo || !npmRegistryInfo) {
          console.log(`Skipping ${linterName} due to missing npm info.`); // eslint-disable-line no-console
          return [];
        }

        const gitHubInfoForThisLinter = githubRepoNames[linterName]
          ? githubInfo[
              `${githubRepoNames[linterName].owner}/${githubRepoNames[linterName].repo}`
            ]
          : undefined;

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
              gitHubInfoForThisLinter,
              lintFrameworks.eslint.id,
              ecosystemNode.id
            );
            break;
          }

          case 'ember-template-lint':
          case 'ember-template-lint-plugin': {
            linterNormalized = await emberTemplateLintLinterToNormalizedLinter(
              linterName,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              linter,
              packageJson,
              npmDownloadsInfo,
              npmRegistryInfo,
              gitHubInfoForThisLinter,
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
              gitHubInfoForThisLinter,
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
              gitHubInfoForThisLinter,
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
              gitHubInfoForThisLinter,
              [],
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

  await updatePackageDeprecationReplacements(ecosystemNode.id);

  return lintersCreated;
}

export async function updatePackageDeprecationReplacements(
  ecosystemId: number
) {
  for (const [deprecatedLinterName, replacements] of Object.entries(
    LINTERS_DEPRECATED
  )) {
    await prisma.package.update({
      where: {
        name_ecosystemId: {
          name: deprecatedLinterName,
          ecosystemId,
        },
      },
      data: {
        deprecatedReplacements: {
          connect: (replacements || []).map((replacement) => ({
            name_ecosystemId: {
              name: replacement,
              ecosystemId,
            },
          })),
        },
      },
    });
  }
}
