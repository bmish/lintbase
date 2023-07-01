import { noCase } from 'no-case';
import { getProperty } from 'dot-prop';
import { boolean, isBooleanable } from 'boolean';

/**
 * Example: FOO => Foo, foo => Foo
 */
export function capitalizeOnlyFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function isBooleanableTrue(value: unknown): boolean {
  return isBooleanable(value) && boolean(value);
}

function isBooleanableFalse(value: unknown): boolean {
  return isBooleanable(value) && !boolean(value);
}

function isConsideredFalse(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    isBooleanableFalse(value)
  );
}

function getPropertyFromRule<T>(rule: T, property: string) {
  return getProperty(rule, property) as unknown; // TODO: Incorrectly typed as undefined. This could be any type, not just undefined (https://github.com/sindresorhus/dot-prop/issues/95).
}

// Based on: https://github.com/bmish/eslint-doc-generator/blob/e9594090e38a4a2e71e56ba0588a5c223435cd5f/lib/rule-list.ts#L294
// TODO: open source this logic.
export function splitList<T>(
  items: readonly T[],
  splitProperties: readonly string[]
): readonly { title?: string; items: readonly T[] }[] {
  const rulesAndHeaders: { title?: string; items: readonly T[] }[] = [];

  // Initially, all items are unused.
  let unusedRules: readonly T[] = items;

  // Loop through each split property.
  for (const ruleListSplitItem of splitProperties) {
    // Store the items and headers for this split property.
    const rulesAndHeadersForThisSplit: {
      title: string;
      items: readonly T[];
    }[] = [];

    // Check what possible values this split property can have.
    const valuesForThisPropertyFromUnusedRules = [
      ...new Set(
        unusedRules.map((item) => getPropertyFromRule(item, ruleListSplitItem))
      ).values(),
    ];
    const valuesForThisPropertyFromAllRules = [
      ...new Set(
        items.map((rule) => getPropertyFromRule(rule, ruleListSplitItem))
      ).values(),
    ];

    // Throw an exception if there are no possible rules with this split property.
    if (
      valuesForThisPropertyFromAllRules.length === 1 &&
      isConsideredFalse(valuesForThisPropertyFromAllRules[0])
    ) {
      throw new Error(
        `No rules found with --rule-list-split property "${ruleListSplitItem}".`
      );
    }

    // For each possible non-disabled value, show a header and list of corresponding rules.
    const valuesNotFalseAndNotTrue =
      valuesForThisPropertyFromUnusedRules.filter(
        (val) => !isConsideredFalse(val) && !isBooleanableTrue(val)
      );
    const valuesTrue = valuesForThisPropertyFromUnusedRules.filter((val) =>
      isBooleanableTrue(val)
    );
    const valuesNew = [
      ...valuesNotFalseAndNotTrue,
      ...(valuesTrue.length > 0 ? [true] : []), // If there are multiple true values, combine them all into one.
    ];
    for (const value of valuesNew.sort((a, b) =>
      String(a).toLowerCase().localeCompare(String(b).toLowerCase())
    )) {
      // Rules with the property set to this value.
      const rulesForThisValue = unusedRules.filter((rule) => {
        const property = getPropertyFromRule(rule, ruleListSplitItem);
        return (
          property === value || (value === true && isBooleanableTrue(property))
        );
      });

      // Turn ruleListSplit into a title.
      // E.g. meta.docs.requiresTypeChecking to "Requires Type Checking".
      const ruleListSplitParts = ruleListSplitItem.split('.');
      const ruleListSplitFinalPart =
        ruleListSplitParts[ruleListSplitParts.length - 1];
      const ruleListSplitTitle = noCase(ruleListSplitFinalPart, {
        transform: (str) => capitalizeOnlyFirstLetter(str),
      });

      // Add a list for the rules with property set to this value.
      rulesAndHeadersForThisSplit.push({
        title: String(isBooleanableTrue(value) ? ruleListSplitTitle : value),
        items: rulesForThisValue,
      });

      // Remove these rules from the unused rules.
      unusedRules = unusedRules.filter(
        (rule) => !rulesForThisValue.includes(rule)
      );
    }

    // Add the rules and headers for this split property to the beginning of the list of all rules and headers.
    rulesAndHeaders.unshift(...rulesAndHeadersForThisSplit);
  }

  // All remaining unused rules go at the beginning.
  if (unusedRules.length > 0) {
    rulesAndHeaders.unshift({ items: unusedRules });
  }

  return rulesAndHeaders;
}
