import { Plugin, Rule } from '@/types';
import { searchDownloadAndLoad } from '@lintbase/downloader';
import type { TSESLint, JSONSchema } from '@typescript-eslint/utils';
import path from 'node:path';

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

function loadedPluginToNormalizedPlugin(
  pluginName: string,
  plugin: TSESLint.Linter.Plugin
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
          us: `/npm/${pluginName}/${ruleName}}`,
          ruleDoc: rule.meta?.docs?.url || null,
        },
        plugin: {
          name: pluginName,
          links: {
            us: `/npm/${pluginName}`,
            packageRegistry: '',
            readme: '',
          },
        },
      };

      return [ruleNormalized];
    }
  );

  const pluginNormalized: Plugin = {
    name: pluginName,
    ecosystem: 'node',
    description: 'fake plugin desc',
    rules,
    stats: {
      prs: Math.round(Math.random() * 100),
      issues: Math.round(Math.random() * 100),
      stars: Math.round(Math.random() * 100),
      watching: Math.round(Math.random() * 100),
      forks: Math.round(Math.random() * 100),
      contributors: Math.round(Math.random() * 100),
      weeklyDownloads: Math.round(Math.random() * 100),
    },
    updatedAt: randomDate(new Date(2020, 0, 1), new Date()).toString(),
    createdAt: randomDate(new Date(2020, 0, 1), new Date()).toString(),
    links: {
      us: `/npm/${pluginName}`,
      packageRegistry: '',
      readme: '',
    },
    keywords: ['fake', 'plugin', 'keywords'],
  };

  return pluginNormalized;
}

export async function getPlugins(): Promise<Plugin[]> {
  const downloadPath = path.join(
    process.cwd(),
    '..',
    'downloader',
    'tmp',
    'npm-packages'
  );

  const pluginRecord = await searchDownloadAndLoad<TSESLint.Linter.Plugin>(
    'eslint-plugin',
    downloadPath
  );

  const pluginsNormalized: Plugin[] = Object.entries(pluginRecord).map(
    ([pluginName, plugin]) => loadedPluginToNormalizedPlugin(pluginName, plugin)
  );

  return pluginsNormalized;
}
