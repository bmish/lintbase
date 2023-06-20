export function asArray<T>(
  value: T | readonly T[] | undefined | null
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
  basedOnProperty?: string
): readonly T[] {
  const seen = new Set<T | string>();

  return array.filter((item) => {
    // @ts-expect-error
    const prop = basedOnProperty ? item[basedOnProperty] : item;
    if (!seen.has(prop)) {
      seen.add(prop);
      return true;
    }
    return false;
  });
}
