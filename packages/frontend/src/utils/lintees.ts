// Initial list.
const LINTER_TO_LINTEES = {
  '@angular-eslint/eslint-plugin': ['@angular/core'],
  '@next/eslint-plugin-next': ['next'],
  '@react-native-community/eslint-plugin': ['react-native'],
  '@typescript-eslint/eslint-plugin': ['typescript'],
  'eslint-plugin-ava': ['ava'],
  'eslint-plugin-cypress': ['cypress'],
  'eslint-plugin-ember': ['ember-cli', 'ember-source'],
  'eslint-plugin-jest': ['jest'],
  'eslint-plugin-jest-dom': ['jest-dom'],
  'eslint-plugin-jest-formatting': ['jest'],
  'eslint-plugin-jsx-a11y': ['react', 'react-dom'],
  'eslint-plugin-lodash': ['lodash'],
  'eslint-plugin-mocha': ['mocha'],
  'eslint-plugin-prettier': ['prettier'],
  'eslint-plugin-qunit': ['qunit'],
  'eslint-plugin-react': ['react', 'react-dom'],
  'eslint-plugin-react-hooks': ['react', 'react-dom'],
  'eslint-plugin-react-native': ['react-native'],
  'eslint-plugin-storybook': ['storybook'],
  'eslint-plugin-tailwindcss': ['tailwindcss'],
  'eslint-plugin-vue': ['vue'],
};

export const LINTERS_RECOMMENDED_ALWAYS = [
  'eslint-plugin-n',
  'eslint-plugin-unicorn',
];

export const LINTERS_RECOMMENDED_NEVER = ['eslint-plugin-jest-formatting'];

export const LINTERS_DEPRECATED = { 'eslint-plugin-node': 'eslint-plugin-n' };

export function getLinteesForLinter(linterName: string) {
  // @ts-expect-error TODO: figure out how to index object by string without error.
  return (LINTER_TO_LINTEES[linterName] as readonly string[] | undefined) || [];
}

export function getLintersForPackage(packageName: string) {
  return Object.entries(LINTER_TO_LINTEES)
    .filter(([, lintees]) => lintees.includes(packageName))
    .map(([linter]) => linter);
}
