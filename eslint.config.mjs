'use strict';

/**
 * FSAA — ESLint flat config (Vite template, ESLint 9).
 * IDENTICAL boundary rules to the Next.js template — the methodology is one,
 * only the bundler/pages-layer differ.
 *
 * Layers: shared <- entities <- features <- pages (react-router here) <- app
 *   1. Imports flow only downward.
 *   2. Features never import each other (graduation guarantee).
 *   3. No circular imports.
 * Differences vs Next template: pages files are src/pages/** (not app/**),
 * and app-layer files are src/app/** (main.tsx).
 */

import importPlugin from 'eslint-plugin-import';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const upwardMessage = 'FSAA upward import: use only layers BELOW your own.';
const appMessage = 'FSAA: nothing imports from app/ — it is the top layer.';

const sharedRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        { group: ['**/app/**', '@app/*'], message: appMessage },
        { group: ['@features/*', '@pages/*'], message: upwardMessage },
      ],
    },
  ],
};

const entitiesRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        { group: ['**/app/**', '@app/*'], message: appMessage },
        { group: ['@features/*', '@pages/*'], message: upwardMessage },
      ],
    },
  ],
};

const featuresRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        { group: ['**/app/**', '@app/*', '@pages/**'], message: appMessage },
        { group: ['@features/*', '@pages/*', 'src/features/**'], message: 'FSAA: features do not import each other — move code via @entities (data) or @shared (UI), or graduate it.' },
      ],
    },
  ],
};

export default [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: [path.join(__dirname, 'tsconfig.json')] },
      },
    },
    rules: {
      'import/no-cycle': ['error', { maxDepth: '∞' }],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: ['**/index.ts'],
    rules: sharedRules,
  },
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    ignores: ['**/index.ts'],
    rules: entitiesRules,
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: ['**/index.ts'],
    rules: featuresRules,
  },
  {
    /* src/pages: may import features + shared (composition of scenarios) */
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/app/**', '@app/**'], message: appMessage }] },
      ],
    },
  },
];