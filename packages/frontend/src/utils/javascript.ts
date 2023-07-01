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
    // @ts-expect-error -- don't know if object has property
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const prop = basedOnProperty ? item[basedOnProperty] : item;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (!seen.has(prop)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      seen.add(prop);
      return true;
    }
    return false;
  });
}
