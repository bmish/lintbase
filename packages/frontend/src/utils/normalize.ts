import { EmberTemplateLint } from '@/utils/types';
import { load } from '@lintbase/downloader';
import type { TSESLint } from '@typescript-eslint/utils';
import path, { join } from 'node:path';
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
import { uniqueArrayItems } from './javascript';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const IGNORED_KEYWORDS = new Set([
  'configs',
  'configuration',
  'configurations',
  'plugin',
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

type NpmRegistryInfo = {
  time: Record<string | 'created' | 'modified', string>;
};

const pluginInclude = {
  rules: {
    include: {
      options: true,
      replacedBy: true,
    },
  },
  configs: true,
  keywords: true,
  // versions: true,
};
async function baseToNormalizedPlugin(
  pluginName: string,
  ecosystem: string,
  linter: string,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo,
  rules: Prisma.RuleCreateWithoutPluginInput[],
  configs: Prisma.ConfigCreateWithoutPluginInput[],
  keywordsToIgnore: Set<string>
): Promise<
  Prisma.PluginGetPayload<{ include: typeof pluginInclude }> | undefined
> {
  if (configs.length === 0 && rules.length === 0) {
    // Probably not an actual plugin.
    return undefined;
  }

  const pluginCreated = await prisma.plugin.create({
    include: pluginInclude,
    data: {
      name: pluginName,
      ecosystem,
      linter,
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

      linkHomepage: packageJson.homepage?.toString() || null,
      linkBugs:
        typeof packageJson.bugs === 'object'
          ? packageJson.bugs.url
          : typeof packageJson.bugs === 'string'
          ? packageJson.bugs
          : null,

      rules: { create: rules },

      configs: { create: configs },

      keywords: {
        create: uniqueArrayItems(packageJson.keywords || [])
          .filter((keyword) => !keywordsToIgnore.has(keyword))
          .map((keyword) => ({ name: keyword })),
      },

      // TODO: too expensive when some plugins have thousands of versions.
      // versions: {
      //   create: Object.entries(npmRegistryInfo.time).map(([version, time]) => ({
      //     version,
      //     publishedAt: new Date(time),
      //   })),
      // },
    },
  });

  return pluginCreated;
}

async function eslintPluginToNormalizedPlugin(
  pluginName: string,
  plugin: TSESLint.Linter.Plugin,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo
): Promise<
  Prisma.PluginGetPayload<{ include: typeof pluginInclude }> | undefined
> {
  const rules = Object.entries(plugin.rules || {}).flatMap(
    ([ruleName, rule]) => {
      if (typeof rule !== 'object') {
        // TODO: handle this case
        return [];
      }

      const ruleNormalized = {
        name: ruleName,
        description: rule.meta?.docs?.description || null,
        fixable: normalizeFixable(rule.meta?.fixable),
        hasSuggestions: rule.meta?.hasSuggestions || false,
        ecosystem: 'node',
        type: rule.meta?.type || null,
        deprecated: rule.meta?.deprecated || false,
        replacedBy: {
          create: uniqueArrayItems(rule.meta?.replacedBy || []).map((name) => ({
            name,
          })),
        },
        // @ts-expect-error -- category not an official property
        category: rule.meta?.docs?.category || null,
        options: {
          create: uniqueArrayItems(getAllNamedOptions(rule.meta?.schema)).map(
            (option) => ({
              name: option,
            })
          ),
        },
        // @ts-expect-error -- requiresTypeChecking not an official property
        requiresTypeChecking: rule.meta?.requiresTypeChecking || false,
        linkRuleDoc: rule.meta?.docs?.url || null,
      };

      return [ruleNormalized];
    }
  );

  const configs = Object.entries(plugin.configs || {}).map(([configName]) => {
    const config = {
      name: configName,
    };

    return config;
  });

  const pluginCreated = await baseToNormalizedPlugin(
    pluginName,
    'node',
    'eslint',
    packageJson,
    npmDownloadsInfo,
    npmRegistryInfo,
    rules,
    configs,
    ESLINT_IGNORED_KEYWORDS
  );

  if (!pluginCreated) {
    // Probably not an actual plugin.
    return undefined;
  }

  const pluginPrefix = getPluginPrefix(pluginName);
  await prisma.ruleConfig.createMany({
    data: Object.entries(plugin.configs || {}).flatMap(
      ([configName, config]) => {
        const configId = pluginCreated.configs.find(
          (configCreated) => configCreated.name === configName
        )?.id;
        if (configId === undefined) {
          return [];
        }
        return Object.entries(config.rules || {}).flatMap(
          ([ruleName, ruleEntry]) => {
            const ruleId = pluginCreated.rules.find(
              (ruleCreated) =>
                (pluginPrefix
                  ? `${pluginPrefix}/${ruleCreated.name}`
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
                pluginId: pluginCreated.id,
                configId,
                ruleId,
              },
            ];
          }
        );
      }
    ),
  });

  return pluginCreated;
}

async function emberTemplateLintPluginToNormalizedPlugin(
  pluginName: string,
  plugin: EmberTemplateLint,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo
): Promise<
  Prisma.PluginGetPayload<{ include: typeof pluginInclude }> | undefined
> {
  const rules = Object.entries(plugin.rules || {}).map(([ruleName]) => {
    const ruleNormalized = {
      name: ruleName,
      description: null, // TODO
      fixable: null, // TODO
      hasSuggestions: false, // Not supported.
      ecosystem: 'node',
      type: null, // Not supported.
      deprecated: false, // Not supported.
      category: null, // Not supported.
      requiresTypeChecking: false, // Not supported.
      linkRuleDoc: null, // TODO
    };

    return ruleNormalized;
  });

  const configs = Object.entries(plugin.configurations || {}).map(
    ([configName]) => {
      const config = {
        name: configName,
      };

      return config;
    }
  );

  const pluginCreated = await baseToNormalizedPlugin(
    pluginName,
    'node',
    'ember-template-lint',
    packageJson,
    npmDownloadsInfo,
    npmRegistryInfo,
    rules,
    configs,
    EMBER_TEMPLATE_LINT_IGNORED_KEYWORDS
  );

  // TODO: create RuleConfigs

  return pluginCreated;
}

export async function loadPluginsToDb() {
  const pluginTypes = [
    'eslint', // base package
    'eslint-plugin',
    'ember-template-lint-plugin',
  ];

  const pluginsCreated = [];

  for (const pluginType of pluginTypes) {
    const downloadPath = path.join(
      process.cwd(),
      '..',
      'downloader',
      'tmp',
      'npm',
      pluginType
    );

    let pluginRecord;

    switch (pluginType) {
      case 'eslint-plugin': {
        pluginRecord = load<TSESLint.Linter.Plugin>(downloadPath);
        break;
      }
      case 'ember-template-lint-plugin': {
        pluginRecord = load<EmberTemplateLint>(downloadPath);
        break;
      }
      case 'eslint': {
        pluginRecord = load<TSESLint.Linter.Plugin>(downloadPath);
        const pathPackage = path.join(downloadPath, 'node_modules', pluginType);

        // Rules/configs are not exported like they are with plugins. Have to manually retrieve them.

        // Convert from LazyLoadingRuleMap to standard object.
        pluginRecord.eslint.rules = Object.fromEntries(
          // eslint-disable-next-line import/no-dynamic-require
          require(join(pathPackage, 'lib', 'rules')).entries()
        );

        // ESLint core rules have a `recommended` property that we can build the config from.
        pluginRecord.eslint.configs = {
          recommended: {
            rules: Object.fromEntries(
              Object.entries(pluginRecord.eslint.rules).map(
                ([ruleName, rule]) => [
                  ruleName,
                  typeof rule === 'object'
                    ? rule.meta.docs?.recommended
                      ? 'error'
                      : 'off'
                    : 'off',
                ]
              )
            ),
          },
        };

        break;
      }
      default: {
        throw new Error(`Unknown plugin type: ${pluginType}`);
      }
    }

    const pluginsCreatedForThisType = await Promise.all(
      Object.entries(pluginRecord).flatMap(async ([pluginName, plugin]) => {
        const pathPackageJson = path.join(
          downloadPath,
          'node_modules',
          pluginName,
          'package.json'
        );
        const packageJson = JSON.parse(
          readFileSync(pathPackageJson, { encoding: 'utf8' })
        ) as PackageJson;

        let npmDownloadsInfo;
        let npmRegistryInfo;
        try {
          // Get info from npm registry.
          // https://github.com/npm/registry/blob/master/docs/download-counts.md
          npmDownloadsInfo = await fetch(
            `https://api.npmjs.org/downloads/point/last-week/${pluginName}`
          ).then((res) => res.json());

          npmRegistryInfo = await fetch(
            `https://registry.npmjs.org/${pluginName}`
          ).then((res) => res.json());
        } catch {
          // eslint-disable-next-line no-console
          console.log(`Fetching npm info failed for ${pluginName}.`);
          return [];
        }

        const pluginNormalized = ['eslint-plugin', 'eslint'].includes(
          pluginType
        )
          ? await eslintPluginToNormalizedPlugin(
              pluginName,
              plugin,
              packageJson,
              npmDownloadsInfo,
              npmRegistryInfo
            )
          : await emberTemplateLintPluginToNormalizedPlugin(
              pluginName,
              plugin,
              packageJson,
              npmDownloadsInfo,
              npmRegistryInfo
            );

        if (!pluginNormalized) {
          // Probably not an actual plugin.
          return [];
        }

        return [pluginNormalized];
      })
    );

    pluginsCreated.push(...pluginsCreatedForThisType);
  }

  return pluginsCreated;
}

export function fixRule(rule: Prisma.RuleGetPayload<{}>) {
  return fixAnyDatesInObject(rule);
}

export function fixPlugin(plugin: Prisma.PluginGetPayload<{}>) {
  return fixAnyDatesInObject(plugin);
}

function fixAnyDatesInObject(object: object): object {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
      if (value instanceof Date) {
        return [key, value.toISOString()]; // Since DataTime can't be serialized by next.
      }

      if (Array.isArray(value)) {
        return [key, value.map((item) => fixAnyDatesInObject(item))];
      }

      if (typeof value === 'object' && value !== null) {
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
    // eslint-disable-next-line no-console
    console.log({ error });
  }
}
