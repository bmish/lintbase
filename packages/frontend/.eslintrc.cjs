module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  extends: [
    'plugin:square/typescript',
    'plugin:node/recommended',
    'plugin:unicorn/recommended', // Turn eslint-plugin-unicorn recommended rules on again because many were turned off by eslint-plugin-square.
    'next/core-web-vitals',
  ],
  env: {
    node: true,
  },
  settings: {
    node: {
      tryExtensions: ['.js', '.jsx', '.json', '.node', '.ts', '.tsx', '.d.ts'],
    },
  },
  rules: {
    // TODO: these import rules are running extremely slowly (several seconds each) so disable for now.
    'import/default': 'off',
    'import/namespace': 'off',
    'import/no-cycle': 'off',
    'import/no-deprecated': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',

    'node/no-missing-import': 'off', // Disabled due to a bug: https://github.com/mysticatea/eslint-plugin-node/issues/342

    'unicorn/no-array-reduce': 'off',
    'unicorn/no-nested-ternary': 'off',
    'unicorn/no-null': 'off',
    'unicorn/prevent-abbreviations': 'off',

    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'no-console': 'error',
    'require-unicode-regexp': 'error',
    'sort-keys': 'off',
  },
  overrides: [
    {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        'node/no-unsupported-features/es-syntax': [
          'error',
          { ignores: ['dynamicImport', 'modules'] },
        ],

        '@typescript-eslint/no-unsafe-assignment': 'off', // TODO
        '@typescript-eslint/prefer-readonly': 'error',
        '@typescript-eslint/require-array-sort-compare': 'error',
      },
    },

    {
      // From eslint-plugin-square React config.
      files: ['src/components/**/*'],
      rules: {
        'filenames/match-exported': ['error', 'pascal'],
        'unicorn/filename-case': ['error', { case: 'pascalCase' }],
      },
    },
    {
      // From eslint-plugin-square React config.
      files: ['src/setupTests.*'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
  ],
};
