import type { JSONSchema, TSESLint } from '@typescript-eslint/utils';
import traverse from 'json-schema-traverse';

/**
 * Gather a list of named options from a rule schema.
 * @param jsonSchema - the JSON schema to check
 * @returns - list of named options we could detect from the schema
 */
export function getAllNamedOptions(
  jsonSchema: JSONSchema.JSONSchema4 | undefined | null
): readonly string[] {
  if (!jsonSchema) {
    return [];
  }

  if (Array.isArray(jsonSchema)) {
    return jsonSchema.flatMap((js: JSONSchema.JSONSchema4) =>
      getAllNamedOptions(js)
    );
  }

  const options: string[] = [];
  traverse(jsonSchema, (js: JSONSchema.JSONSchema4) => {
    if (js.properties) {
      options.push(...Object.keys(js.properties));
    }
  });
  return options;
}

// Copied from: https://github.com/bmish/eslint-doc-generator/blob/e9594090e38a4a2e71e56ba0588a5c223435cd5f/lib/emojis.ts#L11
const EMOJI_A11Y = '♿';
const EMOJI_ERROR = '❗';
const EMOJI_STYLE = '🎨';
const EMOJI_TYPESCRIPT = '⌨️';
const EMOJI_WARNING = '🚸';
/** Default emojis for common configs. */
export const EMOJI_CONFIGS = {
  a11y: EMOJI_A11Y,
  accessibility: EMOJI_A11Y,
  all: '🌐',
  error: EMOJI_ERROR,
  errors: EMOJI_ERROR,
  recommended: '✅',
  strict: '🔒',
  style: EMOJI_STYLE,
  stylistic: EMOJI_STYLE,
  ts: EMOJI_TYPESCRIPT,
  type: EMOJI_TYPESCRIPT,
  typed: EMOJI_TYPESCRIPT,
  types: EMOJI_TYPESCRIPT,
  typescript: EMOJI_TYPESCRIPT,
  warning: EMOJI_WARNING,
  warnings: EMOJI_WARNING,
};

export function getPluginPrefix(name: string): string {
  return name.endsWith('/eslint-plugin')
    ? name.split('/')[0] // Scoped plugin name like @my-scope/eslint-plugin.
    : name.replace('eslint-plugin-', ''); // Unscoped name like eslint-plugin-foo or scoped name like @my-scope/eslint-plugin-foo.
}

function severityNumberToString(severity: 0 | 1 | 2): 'off' | 'warn' | 'error' {
  switch (severity) {
    case 0: {
      return 'off';
    }
    case 1: {
      return 'warn';
    }
    case 2: {
      return 'error';
    }
    default: {
      return 'off';
    }
  }
}

export function ruleEntryToStringSeverity(
  ruleEntry: TSESLint.Linter.RuleEntry
): 'off' | 'warn' | 'error' {
  if (typeof ruleEntry === 'number') {
    return severityNumberToString(ruleEntry);
  }

  if (typeof ruleEntry === 'string') {
    return ruleEntry;
  }

  if (Array.isArray(ruleEntry)) {
    if (typeof ruleEntry[0] === 'number') {
      return severityNumberToString(ruleEntry[0]);
    }
    return ruleEntry[0];
  }

  return 'off';
}
