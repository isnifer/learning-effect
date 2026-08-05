import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const config = defineConfig({
  base: '/',
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url)),
    },
    preserveSymlinks: false,
  },
  server: {
    proxy: {
      '/api/rpc': 'http://127.0.0.1:3000',
      '/mcp': 'http://127.0.0.1:3000',
    },
  },
  plugins: [tanstackRouter({ target: 'react' }), tailwindcss(), viteReact()],
})

export default config
