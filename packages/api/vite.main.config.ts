import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: 'src/electron/main.ts',
      fileName: () => 'main.cjs',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['better-sqlite3'],
    },
  },
})
