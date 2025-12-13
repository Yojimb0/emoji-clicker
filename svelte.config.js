import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Determine base path for GitHub Pages
// In GitHub Actions, use PUBLIC_BASE_PATH env var
// For local dev, use empty string
const basePath = process.env.PUBLIC_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/emoji-clicker' : '');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		paths: {
			base: basePath
		},
		prerender: {
			handleHttpError: 'warn',
			entries: ['*']
		}
	}
};

export default config;

