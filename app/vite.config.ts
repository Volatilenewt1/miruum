import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte({
    onwarn(warning, defaultHandler) {
      if (warning.code.startsWith('a11y')) return;
      defaultHandler!(warning);
    },
  })],
  server: {
    host: true,
    allowedHosts: 'all',
  },
})
