import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module'
			},
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			'no-unused-vars': 'off', // TypeScript handles this
			'@typescript-eslint/no-unused-vars': ['warn', { 
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_'
			}]
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			},
			globals: {
				...globals.browser,
				...globals.es2021
			}
		},
		rules: {
			// Svelte-specific rules
			'svelte/no-at-html-tags': 'warn',
			'svelte/valid-compile': 'error',
			'svelte/no-unused-svelte-ignore': 'error',
			// Relax some rules for game UI
			'svelte/require-each-key': 'warn',
			// Allow unused vars in script tags (they're used in templates)
			'no-unused-vars': 'off'
		}
	},
	{
		ignores: [
			'build/**',
			'.svelte-kit/**',
			'node_modules/**',
			'dist/**',
			'.env*'
		]
	}
];

