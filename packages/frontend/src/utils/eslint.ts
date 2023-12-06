import type { JSONSchema, TSESLint } from '@typescript-eslint/utils';
import traverse from 'json-schema-traverse';

export type RuleOption = {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  enum?: readonly JSONSchema.JSONSchema4Type[];
  default?: JSONSchema.JSONSchema4Type;
  deprecated?: boolean;
};

/**
 * Gather a list of named options from a rule schema.
 * @param jsonSchema - the JSON schema to check
 * @returns - list of named options we could detect from the schema
 */
export function getAllNamedOptions(
  jsonSchema:
    | JSONSchema.JSONSchema4
    | readonly JSONSchema.JSONSchema4[]
    | undefined
    | null,
): readonly RuleOption[] {
  if (!jsonSchema) {
    return [];
  }

  if (Array.isArray(jsonSchema)) {
    return jsonSchema.flatMap((js: JSONSchema.JSONSchema4) =>
      getAllNamedOptions(js),
    );
  }

  const options: RuleOption[] = [];
  traverse(jsonSchema, (js: JSONSchema.JSONSchema4) => {
    if (js.properties) {
      options.push(
        ...Object.entries(js.properties).map(([key, value]) => ({
          name: key,
          type:
            value.type === 'array' &&
            !Array.isArray(value.items) &&
            value.items?.type
              ? `${value.items.type.toString()}[]`
              : value.type
                ? value.type.toString()
                : undefined,
          description: value.description,
          default: value.default,
          enum: value.enum,
          required:
            typeof value.required === 'boolean'
              ? value.required
              : Array.isArray(js.required) && js.required.includes(key),
          deprecated: value.deprecated,
        })),
      );
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

export function getPluginPrefix(name: string): string | undefined {
  if (name.endsWith('/eslint-plugin')) {
    // Scoped plugin name like @my-scope/eslint-plugin.
    return name.split('/')[0];
  }

  if (name.includes('eslint-plugin-')) {
    // Unscoped name like eslint-plugin-foo or scoped name like @my-scope/eslint-plugin-foo.
    return name.replace('eslint-plugin-', '');
  }

  // base package name like eslint.
  return undefined;
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
  ruleEntry: TSESLint.Linter.RuleEntry,
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

export function normalizeFixable(
  val: boolean | string | null | undefined,
): 'code' | 'whitespace' | null {
  if (val === 'code' || val === true || val === 'true') {
    return 'code';
  }
  if (val === 'whitespace') {
    return 'whitespace';
  }
  return null;
}

/**
 * Enum version of this union type: TSESLint.RuleMetaData<''>['type'];
 */
enum RULE_TYPE {
  'problem' = 'problem',
  'suggestion' = 'suggestion',
  'layout' = 'layout',
}
export const EMOJIS_TYPE: { [key in RULE_TYPE]: string } = {
  [RULE_TYPE.problem]: '❗',
  [RULE_TYPE.suggestion]: '📖',
  [RULE_TYPE.layout]: '📏',
};

export function isRuleType(s: string): s is keyof typeof EMOJIS_TYPE {
  return s in EMOJIS_TYPE;
}
