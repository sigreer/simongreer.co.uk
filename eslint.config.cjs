const eslintPluginImport = require('eslint-plugin-import');
const eslintPluginAstro = require('eslint-plugin-astro'); 
const eslintPluginReact = require('eslint-plugin-react');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.astro/**',
      '*.config.js',
      '*.config.mjs',
      '.wrangler/**',
      '.vscode/**'
    ]
  },
  // Config for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      import: eslintPluginImport,
      '@typescript-eslint': typescript
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      }
    }
  },
  // Config for JavaScript and JSX files
  {

      files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      react: eslintPluginReact
    },
    languageOptions: {
      parserOptions: {  
        ecmaFeatures: {
          jsx: true,
          },
        },
      },
      rules: {
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
       },
  },

  ...eslintPluginAstro.configs['flat/recommended']
];
