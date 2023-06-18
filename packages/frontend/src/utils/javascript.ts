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
