// @ts-check
import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

const site = new URL(process.env.SITE_URL || 'http://localhost:4321')

// Statische Website. Nur /preview/* und /api/form laufen on demand (prerender = false)
// über den Node-Server – fällt das CMS aus, bleibt der statische Teil erreichbar.
export default defineConfig({
  site: site.href,
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  // Der Builder im Container baut jede Fassung in ein eigenes Verzeichnis.
  outDir: process.env.ASTRO_OUT_DIR || './dist',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  prefetch: false,
  devToolbar: { enabled: false },
  security: {
    // Hinter Caddy/Nginx Proxy Manager: X-Forwarded-Host/-Proto der eigenen Domain vertrauen,
    // sonst schlägt die Origin-Prüfung (CSRF) bei POST /api/form fehl.
    allowedDomains: [{ hostname: site.hostname, protocol: site.protocol.replace(':', '') }],
  },
  vite: { plugins: [tailwindcss()] },
})
