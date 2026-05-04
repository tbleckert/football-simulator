import { fileURLToPath, URL } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    root: 'demo',
    plugins: [svelte()],
    server: {
        host: '127.0.0.1',
        port: 5173,
        fs: {
            allow: [projectRoot],
        },
    },
    resolve: {
        alias: {
            $simulator: projectRoot,
            $demo: fileURLToPath(new URL('./demo/src', import.meta.url)),
        },
    },
    build: {
        outDir: '../dist-demo',
        emptyOutDir: true,
    },
});
