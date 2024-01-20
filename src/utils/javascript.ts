/**
 * General JavaScript utilities.
 */

/**
 * Convert a value to an array if it's not already.
 */
export function asArray<T>(
  value: T | readonly T[] | undefined | null,
): readonly T[] {
  // eslint-disable-next-line unicorn/no-instanceof-array -- incorrect TypeScript narrowing
  if (value instanceof Array) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

export function uniqueItems<T>(
  array: readonly T[],
  propertyOrCallback?: string | ((i: T) => unknown),
): readonly T[] {
  const seen = new Set<T | unknown>();

  return array.filter((item) => {
    const callbackEvaluation =
      typeof propertyOrCallback === 'function'
        ? propertyOrCallback(item)
        : undefined;
    const propertyEvaluation =
      typeof propertyOrCallback === 'string'
        ? // @ts-expect-error -- don't know if object has property
          item[propertyOrCallback]
        : undefined;
    const prop = callbackEvaluation || propertyEvaluation;
    if (!seen.has(prop)) {
      seen.add(prop);
      return true;
    }
    return false;
  });
}

export async function createObjectAsync<T>(
  keys: string[],
  create: (_key: string) => Promise<T>,
): Promise<Record<string, T>> {
  const results = await Promise.all(keys.map((key) => create(key)));
  return Object.fromEntries(
    results.map((result, index) => [keys[index], result]),
  );
}
