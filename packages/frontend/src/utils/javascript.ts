export function uniqueArrayItems(array: readonly string[]): readonly string[] {
  return [...new Set(array)];
}
