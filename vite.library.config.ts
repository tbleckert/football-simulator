import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            bundleTypes: true,
            tsconfigPath: './tsconfig.json',
        }),
    ],
    build: {
        lib: {
            entry: fileURLToPath(new URL('./index.ts', import.meta.url)),
            formats: ['es'],
            fileName: () => 'index.js',
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            external: ['events'],
        },
    },
});
