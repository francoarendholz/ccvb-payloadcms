import { defineConfig, devices } from '@playwright/test'

// Testet den fertigen Build (statisch + Node-Server für /api/form).
// Voraussetzung: `pnpm build` mit laufendem CMS.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4322' },
  webServer: {
    command: 'HOST=127.0.0.1 PORT=4322 node dist/server/entry.mjs',
    url: 'http://localhost:4322/',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
