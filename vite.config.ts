import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// Node's `process` typed locally so we don't need to pull in @types/node
// just to read one build-time env var.
declare const process: { env: Record<string, string | undefined> };

// GitHub Pages serves a project repo under /<repo>. The deploy workflow passes
// BASE_PATH (bare repo name or with a leading slash); normalize to SvelteKit's
// required `'' | /${string}` shape. Empty locally → app stays at the root.
const rawBase = process.env.BASE_PATH ?? '';
const basePath = (rawBase === '' || rawBase.startsWith('/') ? rawBase : `/${rawBase}`) as
    | ''
    | `/${string}`;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter({
                pages: 'build',
                assets: 'build',
                fallback: '404.html',
                precompress: false,
                strict: true
            }),
            // Served from a GitHub Pages project subpath (e.g. /Zenno) in CI;
            // empty locally. The deploy workflow sets BASE_PATH to the repo name.
            paths: {
                base: basePath
            }
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
