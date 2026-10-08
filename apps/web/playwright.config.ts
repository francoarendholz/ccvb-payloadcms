import { defineConfig, devices } from '@playwright/test'

// Testet den fertigen Build (statisch + Node-Server für /api/form).
// Voraussetzung: `pnpm build` mit laufendem CMS.
// Mit BASE_URL gegen einen laufenden Stack, z. B. Caddy lokal: BASE_URL=http://localhost:8130 pnpm test
const baseURL = process.env.BASE_URL || 'http://localhost:4322'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'HOST=127.0.0.1 PORT=4322 node dist/server/entry.mjs',
        url: 'http://localhost:4322/',
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
