import { Plugin } from './types';

export const FAKE_PLUGINS: Plugin[] = [
  {
    name: 'eslint-plugin-unicorn',
    ecosystem: 'JavaScript',
    links: {
      us: '/npm/eslint-plugin-unicorn',
      packageRegistry: 'https://www.npmjs.com/package/eslint-plugin-unicorn',
      readme: 'https://github.com/sindresorhus/eslint-plugin-unicorn',
    },
    description: 'More than 100 powerful ESLint rules',
    keywords: [
      'nodejs',
      'javascript',
      'eslint',
      'eslint-plugin',
      'unicorns',
      'eslint-config',
      'linting-rules',
      'eslint-rules',
      'xo',
    ],
    rules: [
      {
        name: 'prefer-array-flat-map',
        plugin: {
          name: 'eslint-plugin-unicorn',
          links: {
            us: '/npm/eslint-plugin-unicorn',
            packageRegistry:
              'https://www.npmjs.com/package/eslint-plugin-unicorn',
            readme: 'https://github.com/sindresorhus/eslint-plugin-unicorn',
          },
        },
        ecosystem: 'JavaScript',
        fixable: 'code',
        hasSuggestions: false,
        type: 'suggestion',
        deprecated: false,
        replacedBy: [],
        category: 'Stylistic Issues',
        options: [],
        description: 'Prefer `Array#flatMap()` over `.map().flat()`.',
        requiresTypeChecking: false,
        links: {
          us: '/npm/eslint-plugin-unicorn/prefer-array-flat-map',
          ruleDoc:
            'https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-flat-map.md',
        },
        updatedAt: '2020-10-20T15:00:00.000Z',
        createdAt: '2017-01-01T15:00:00.000Z',
      },
    ],
    stats: {
      stars: 3200,
      watching: 24,
      forks: 336,
      contributors: 127,
      weeklyDownloads: 1457661,
      issues: 315,
      prs: 11,
    },
    updatedAt: '2020-10-20T15:00:00.000Z',
    createdAt: '2017-01-01T15:00:00.000Z',
  },
];
