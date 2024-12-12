import { FlatCompat } from '@eslint/eslintrc'
import eslintParserAstro from 'astro-eslint-parser'
import { defineFlatConfig } from 'eslint-define-config'
import eslintPluginAstro from 'eslint-plugin-astro'
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist'
import eslintPluginTypeScript from 'typescript-eslint'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
})

export default defineFlatConfig([
  {
    ignores: ['dist/', '.astro/', 'src/env.d.ts', '.history/']
  },
  ...compat.extends('eslint-config-standard'),
  {
    plugins: {
      perfectionist: eslintPluginPerfectionist
    },
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            'type',
            ['builtin', 'external'],
            'internal-type',
            'internal',
            ['parent-type', 'sibling-type', 'index-type'],
            ['parent', 'sibling', 'index'],
            'object',
            'unknown'
          ],
          ignoreCase: true,
          internalPattern: ['^@/.+'],
          newlinesBetween: 'always',
          order: 'asc',
          partitionByComment: false,
          partitionByNewLine: false,
          specialCharacters: 'keep',
          type: 'alphabetical'
        }
      ],
      'perfectionist/sort-object-types': [
        'error',
        {
          groups: [],
          ignoreCase: true,
          ignorePattern: [],
          newlinesBetween: 'ignore',
          order: 'asc',
          partitionByComment: false,
          partitionByNewLine: false,
          specialCharacters: 'keep',
          type: 'alphabetical'
        }
      ],
      'perfectionist/sort-objects': [
        'error',
        {
          destructuredObjects: true,
          ignoreCase: true,
          newlinesBetween: 'ignore',
          objectDeclarations: true,
          order: 'asc',
          partitionByComment: false,
          partitionByNewLine: false,
          specialCharacters: 'keep',
          type: 'alphabetical'
        }
      ]
    }
  },
  {
    files: ['**/*.ts', '**/*.astro'],
    languageOptions: {
      parser: eslintPluginTypeScript.parser,
      parserOptions: {
        project: true
      }
    },
    plugins: {
      '@typescript-eslint': eslintPluginTypeScript.plugin
    },
    rules: {
      ...eslintPluginTypeScript.configs.recommended.rules,
      'no-unused-vars': 'off'
    }
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: eslintParserAstro,
      parserOptions: {
        parser: eslintPluginTypeScript.parser,
        project: true
      }
    },
    plugins: {
      astro: eslintPluginAstro
    },
    rules: {
      ...eslintPluginAstro.configs['flat/recommended'].rules
    }
  }
])
