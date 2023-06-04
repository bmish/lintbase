import { Config, Plugin, Rule } from '@/types';
import { load } from '@lintbase/downloader';
import type { TSESLint, JSONSchema } from '@typescript-eslint/utils';
import path from 'node:path';
import { PackageJson } from 'type-fest';
import { readFileSync } from 'node:fs';

/**
 * Check if a rule schema is non-blank/empty and thus has actual options.
 * @param jsonSchema - the JSON schema to check
 * @returns - whether the schema has options
 */
function hasOptions(jsonSchema: JSONSchema.JSONSchema4): boolean {
  return (
    (Array.isArray(jsonSchema) && jsonSchema.length > 0) ||
    (typeof jsonSchema === 'object' && Object.keys(jsonSchema).length > 0)
  );
}

function randomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

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

function eslintPluginToNormalizedPlugin(
  pluginName: string,
  plugin: TSESLint.Linter.Plugin,
  packageJson: PackageJson
): Plugin {
  const rules = Object.entries(plugin.rules || {}).flatMap(
    ([ruleName, rule]) => {
      if (typeof rule !== 'object') {
        // TODO: handle this case
        return [];
      }

      const ruleNormalized: Rule = {
        name: ruleName,
        description: rule.meta?.docs?.description || null,
        fixable: rule.meta?.fixable || 'code',
        hasSuggestions: rule.meta?.hasSuggestions || false,
        ecosystem: 'node',
        type: rule.meta?.type || null,
        deprecated: rule.meta?.deprecated || false,
        replacedBy: rule.meta?.replacedBy || [],
        // @ts-expect-error -- category not an official property
        category: rule.meta?.docs?.category || null,
        options: hasOptions(rule.meta?.schema) ? [{}] : null,
        // @ts-expect-error -- requiresTypeChecking not an official property
        requiresTypeChecking: rule.meta?.requiresTypeChecking || false,
        updatedAt: randomDate(new Date(2020, 0, 1), new Date()).toString(),
        createdAt: randomDate(new Date(2020, 0, 1), new Date()).toString(),
        links: {
          us: `/npm/${encodeURIComponent(pluginName)}/${encodeURIComponent(
            ruleName
          )}`,
          ruleDoc: rule.meta?.docs?.url || null,
        },
        plugin: {
          name: pluginName,
          links: {
            us: `/npm/${encodeURIComponent(pluginName)}`,
            packageRegistry: `https://www.npmjs.com/package/${pluginName}`,
            readme: packageJson.homepage?.toString() || null,
          },
        },
      };

      return [ruleNormalized];
    }
  );

  const configNormalized = Object.entries(plugin.configs || {}).map(
    ([configName]) => {
      const config: Config = {
        name: configName,
        description: 'fake config desc',
      };

      return config;
    }
  );

  const pluginNormalized: Plugin = {
    name: pluginName,
    ecosystem: 'node',
    linter: 'eslint',
    description: packageJson.description || null,

    rules,
    configs: configNormalized,

    // TODO: get real data from npm/github
    stats: {
      prs: Math.round(Math.random() * 100),
      issues: Math.round(Math.random() * 100),
      stars: Math.round(Math.random() * 100),
      watching: Math.round(Math.random() * 100),
      forks: Math.round(Math.random() * 100),
      contributors: Math.round(Math.random() * 100),
      weeklyDownloads: Math.round(Math.random() * 100),
    },

    // TODO: get real data from npm/github
    updatedAt: randomDate(new Date(2020, 0, 1), new Date()).toString(),
    createdAt: randomDate(new Date(2020, 0, 1), new Date()).toString(),

    links: {
      us: `/npm/${encodeURIComponent(pluginName)}`,
      packageRegistry: `https://www.npmjs.com/package/${pluginName}`,
      readme: packageJson.homepage?.toString() || null,
    },

    keywords:
      packageJson.keywords?.filter(
        (keyword) => !ESLINT_IGNORED_KEYWORDS.has(keyword)
      ) || null,
  };

  return pluginNormalized;
}

type EmberTemplateLint = {
  configurations: Record<string, { rules: {} }>;
  rules: Record<string, {}>;
};

function etlPluginToNormalizedPlugin(
  pluginName: string,
  plugin: EmberTemplateLint,
  packageJson: PackageJson
): Plugin {
  const rules = Object.entries(plugin.rules || {}).map(([ruleName]) => {
    const ruleNormalized: Rule = {
      name: ruleName,
      description: null, // TODO
      fixable: null, // TODO
      hasSuggestions: false, // Not supported.
      ecosystem: 'node',
      type: null, // Not supported.
      deprecated: false, // Not supported.
      replacedBy: [], // Not supported.
      category: null, // Not supported.
      options: null, // TODO
      requiresTypeChecking: false, // Not supported.
      updatedAt: randomDate(new Date(2020, 0, 1), new Date()).toString(), // TODO
      createdAt: randomDate(new Date(2020, 0, 1), new Date()).toString(), // TODO
      links: {
        us: `/npm/${encodeURIComponent(pluginName)}/${encodeURIComponent(
          ruleName
        )}`,
        ruleDoc: null, // TODO
      },
      plugin: {
        name: pluginName,
        links: {
          us: `/npm/${encodeURIComponent(pluginName)}`,
          packageRegistry: `https://www.npmjs.com/package/${pluginName}`,
          readme: packageJson.homepage?.toString() || null,
        },
      },
    };

    return ruleNormalized;
  });

  const configNormalized = Object.entries(plugin.configurations || {}).map(
    ([configName]) => {
      const config: Config = {
        name: configName,
        description: 'fake config desc',
      };

      return config;
    }
  );

  const pluginNormalized: Plugin = {
    name: pluginName,
    ecosystem: 'node',
    linter: 'ember-template-lint',
    description: packageJson.description || null,

    rules,
    configs: configNormalized,

    // TODO: get real data from npm/github
    stats: {
      prs: Math.round(Math.random() * 100),
      issues: Math.round(Math.random() * 100),
      stars: Math.round(Math.random() * 100),
      watching: Math.round(Math.random() * 100),
      forks: Math.round(Math.random() * 100),
      contributors: Math.round(Math.random() * 100),
      weeklyDownloads: Math.round(Math.random() * 100),
    },

    // TODO: get real data from npm/github
    updatedAt: randomDate(new Date(2020, 0, 1), new Date()).toString(),
    createdAt: randomDate(new Date(2020, 0, 1), new Date()).toString(),

    links: {
      us: `/npm/${encodeURIComponent(pluginName)}`,
      packageRegistry: `https://www.npmjs.com/package/${pluginName}`,
      readme: packageJson.homepage?.toString() || null,
    },

    keywords:
      packageJson.keywords?.filter(
        (keyword) => !EMBER_TEMPLATE_LINT_IGNORED_KEYWORDS.has(keyword)
      ) || null,
  };

  return pluginNormalized;
}

export function getPlugins(): Plugin[] {
  const pluginTypes = ['eslint-plugin', 'ember-template-lint-plugin'];

  const plugins: Plugin[] = [];

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

    const pluginsNormalized: Plugin[] = Object.entries(pluginRecord).flatMap(
      ([pluginName, plugin]) => {
        // load package.json from
        const pathPackageJson = path.join(
          downloadPath,
          'node_modules',
          pluginName,
          'package.json'
        );
        const packageJson = JSON.parse(
          readFileSync(pathPackageJson, { encoding: 'utf8' })
        ) as PackageJson;

        const pluginNormalized =
          pluginType === 'eslint-plugin'
            ? eslintPluginToNormalizedPlugin(pluginName, plugin, packageJson)
            : etlPluginToNormalizedPlugin(pluginName, plugin, packageJson);

        if (
          pluginNormalized.configs.length === 0 &&
          pluginNormalized.rules.length === 0
        ) {
          // Probably not an actual plugin.
          return [];
        }

        return [pluginNormalized];
      }
    );

    plugins.push(...pluginsNormalized);
  }

  return plugins;
}
