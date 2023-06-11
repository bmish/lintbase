import { Plugin, Rule, EmberTemplateLint } from '@/utils/types';
import { load } from '@lintbase/downloader';
import type { TSESLint } from '@typescript-eslint/utils';
import path from 'node:path';
import { PackageJson } from 'type-fest';
import { readFileSync } from 'node:fs';
import { prisma } from '../server/db';
import { getAllNamedOptions } from './eslint';

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

async function eslintPluginToNormalizedPlugin(
  pluginName: string,
  plugin: TSESLint.Linter.Plugin,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo
): Promise<Plugin> {
  const pluginCreated = await prisma.plugin.create({
    include: {
      rules: {
        include: {
          options: true,
          replacedBy: true,
        },
      },
      configs: true,
      keywords: true,
      versions: true,
    },
    data: {
      name: pluginName,
      ecosystem: 'node',
      linter: 'eslint',
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

      rules: {
        create: Object.entries(plugin.rules || {}).flatMap(
          ([ruleName, rule]) => {
            if (typeof rule !== 'object') {
              // TODO: handle this case
              return [];
            }

            const ruleNormalized = {
              name: ruleName,
              description: rule.meta?.docs?.description || null,
              fixable: rule.meta?.fixable || null,
              hasSuggestions: rule.meta?.hasSuggestions || false,
              ecosystem: 'node',
              type: rule.meta?.type || null,
              deprecated: rule.meta?.deprecated || false,
              replacedBy: {
                create: (rule.meta?.replacedBy || []).map((name) => ({ name })),
              },
              // @ts-expect-error -- category not an official property
              category: rule.meta?.docs?.category || null,
              options: {
                create: getAllNamedOptions(rule.meta?.schema).map((option) => ({
                  name: option,
                })),
              },
              // @ts-expect-error -- requiresTypeChecking not an official property
              requiresTypeChecking: rule.meta?.requiresTypeChecking || false,
              linkRuleDoc: rule.meta?.docs?.url || null,
            };

            return [ruleNormalized];
          }
        ),
      },

      configs: {
        create: Object.entries(plugin.configs || {}).map(([configName]) => {
          const config = {
            name: configName,
          };

          return config;
        }),
      },

      keywords: {
        create:
          packageJson.keywords
            ?.filter((keyword) => !ESLINT_IGNORED_KEYWORDS.has(keyword))
            .map((keyword) => ({ name: keyword })) || [],
      },

      versions: {
        create: Object.entries(npmRegistryInfo.time).map(([version, time]) => ({
          version,
          publishedAt: new Date(time),
        })),
      },
    },
  });

  return pluginCreated;
}

async function etlPluginToNormalizedPlugin(
  pluginName: string,
  plugin: EmberTemplateLint,
  packageJson: PackageJson,
  npmDownloadsInfo: { downloads: number },
  npmRegistryInfo: NpmRegistryInfo
): Promise<Plugin> {
  const pluginCreated = await prisma.plugin.create({
    include: {
      rules: true,
      configs: true,
      keywords: true,
      versions: true,
    },
    data: {
      name: pluginName,
      ecosystem: 'node',
      linter: 'ember-template-lint',
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
      linkBugs: packageJson.bugs?.toString() || null,

      rules: {
        create: Object.entries(plugin.rules || {}).map(([ruleName]) => {
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
        }),
      },

      configs: {
        create: Object.entries(plugin.configurations || {}).map(
          ([configName]) => {
            const config = {
              name: configName,
            };

            return config;
          }
        ),
      },

      keywords: {
        create:
          packageJson.keywords
            ?.filter(
              (keyword) => !EMBER_TEMPLATE_LINT_IGNORED_KEYWORDS.has(keyword)
            )
            .map((keyword) => ({ name: keyword })) || [],
      },

      versions: {
        create: Object.entries(npmRegistryInfo.time).map(([version, time]) => ({
          version,
          publishedAt: new Date(time),
        })),
      },
    },
  });

  return pluginCreated;
}

export async function loadPluginsToDb() {
  const pluginTypes = ['eslint-plugin', 'ember-template-lint-plugin'];

  for (const pluginType of pluginTypes) {
    const downloadPath = path.join(
      process.cwd(),
      '..',
      'downloader',
      'tmp',
      'npm',
      pluginType
    );

    const pluginRecord =
      pluginType === 'eslint-plugin'
        ? load<TSESLint.Linter.Plugin>(downloadPath)
        : load<EmberTemplateLint>(downloadPath);

    await Object.entries(pluginRecord).flatMap(async ([pluginName, plugin]) => {
      const pathPackageJson = path.join(
        downloadPath,
        'node_modules',
        pluginName,
        'package.json'
      );
      const packageJson = JSON.parse(
        readFileSync(pathPackageJson, { encoding: 'utf8' })
      ) as PackageJson;

      // Get info from npm registry.
      // https://github.com/npm/registry/blob/master/docs/download-counts.md
      const npmDownloadsInfo = await fetch(
        `https://api.npmjs.org/downloads/point/last-week/${pluginName}`
      ).then((res) => res.json());

      const npmRegistryInfo = await fetch(
        `https://registry.npmjs.org/${pluginName}`
      ).then((res) => res.json());

      const pluginNormalized =
        pluginType === 'eslint-plugin'
          ? await eslintPluginToNormalizedPlugin(
              pluginName,
              plugin,
              packageJson,
              npmDownloadsInfo,
              npmRegistryInfo
            )
          : await etlPluginToNormalizedPlugin(
              pluginName,
              plugin,
              packageJson,
              npmDownloadsInfo,
              npmRegistryInfo
            );

      if (
        pluginNormalized.configs.length === 0 &&
        pluginNormalized.rules.length === 0
      ) {
        // Probably not an actual plugin.
        return [];
      }

      return [pluginNormalized];
    });
  }
}

export function fixRule(rule: Rule) {
  return fixAnyDatesInObject(rule);
}

export function fixPlugin(plugin: Plugin) {
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
