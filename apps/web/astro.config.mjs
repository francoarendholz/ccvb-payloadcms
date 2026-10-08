// @ts-check
import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// Statische Website. Nur /preview/* und /api/form laufen on demand (prerender = false)
// über den Node-Server – fällt das CMS aus, bleibt der statische Teil erreichbar.
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  prefetch: false,
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
})
