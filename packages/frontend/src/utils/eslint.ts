import type { JSONSchema } from '@typescript-eslint/utils';
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
