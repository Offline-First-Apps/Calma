import tsParser from '@typescript-eslint/parser';

import calma from './calma-plugin.js';

/**
 * Package import boundaries, as lint rules.
 *
 * Two rules in systems/01-architecture.md are load-bearing enough that a code
 * review is not a good enough place to enforce them:
 *
 *   1. Only `packages/db` may touch MMKV. Storage is where someone's private
 *      worries live; there is one door into it, and it is the repository.
 *   2. `packages/domain` may not import anything platform-bound. That is what
 *      keeps tier rules, week keys and breathing maths testable in Node with
 *      no simulator — the moment React Native leaks in, it stops being true.
 *
 * These are flat-config fragments, composed by the root `eslint.config.js`.
 */

const MMKV_MESSAGE =
  'Only packages/db may import react-native-mmkv. Use a repository from @calma/db.';

const PLATFORM_MESSAGE =
  '@calma/domain must stay dependency-free — no React, React Native, Expo, ' +
  'storage or i18n. Domain logic returns keys and data, never a rendered ' +
  'sentence: a pure function that returns "3 days in a row" cannot be ' +
  'translated. Platform code belongs in apps/native or packages/db.';

/** Directories no lint run should ever descend into. */
export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/.expo/**',
    '**/.turbo/**',
    '**/*.gen.ts',
    'designs/**',
    'apps/native/assets/**',
  ],
};

/**
 * Parse TypeScript without type information.
 *
 * Boundary rules are syntactic — they only need to see the import statement —
 * so the project service is not worth the startup cost here.
 */
export const typescript = {
  files: ['**/*.{ts,tsx,mts,cts}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  },
};

/** MMKV is reachable from `packages/db` and nowhere else. */
export const mmkvBoundary = {
  files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
  ignores: ['packages/db/**'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [{ name: 'react-native-mmkv', message: MMKV_MESSAGE }],
        patterns: [{ group: ['react-native-mmkv/*'], message: MMKV_MESSAGE }],
      },
    ],
  },
};

/**
 * `packages/domain` imports nothing platform-bound.
 *
 * This replaces the MMKV rule rather than adding to it — flat config merges by
 * rule name — so the MMKV restriction is repeated in the group below.
 */
export const domainBoundary = {
  files: ['packages/domain/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [{ name: 'react-native-mmkv', message: MMKV_MESSAGE }],
        patterns: [
          {
            group: [
              'react',
              'react-dom',
              'react/*',
              'react-native',
              'react-native-*',
              '@react-native/*',
              '@react-native-*/*',
              'expo',
              'expo-*',
              '@expo/*',
              'zustand',
              'zustand/*',
              '@calma/db',
              '@calma/db/*',
              '@calma/i18n',
              '@calma/i18n/*',
              '@calma/tokens',
              '@calma/tokens/*',
            ],
            message: PLATFORM_MESSAGE,
          },
        ],
      },
    ],
  },
};

/**
 * Every string goes through `@calma/i18n`.
 *
 * Scoped to `features/` because that is where product copy lives. A literal in
 * a component is a string no translator will ever see — and, since tone is
 * reviewed against the JSON, one no tone audit will catch either.
 */
export const literalCopyBoundary = {
  files: ['apps/native/src/features/**/*.tsx', 'apps/native/src/app/**/*.tsx'],
  plugins: { calma },
  rules: {
    'calma/no-literal-jsx-text': 'error',
  },
};

/** The whole boundary set, in the order the root config applies it. */
export default [
  ignores,
  typescript,
  mmkvBoundary,
  domainBoundary,
  literalCopyBoundary,
];
