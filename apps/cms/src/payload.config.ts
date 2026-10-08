import { postgresAdapter } from '@payloadcms/db-postgres'
import { de } from '@payloadcms/translations/languages/de'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { DEFAULT_LOCALE, LOCALES } from '@ccvb/shared'
import { Categories } from './collections/Categories'
import { Documents } from './collections/Documents'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { People } from './collections/People'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { richTextEditor } from './fields/lexical'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { migrations } from './migrations'
import { plugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.SERVER_URL || 'http://localhost:3000'
const webURL = process.env.WEB_URL || 'http://localhost:4321'

export default buildConfig({
  serverURL,
  cors: [serverURL, webURL],
  csrf: [serverURL, webURL],
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' – CCVB CMS' },
    dateFormat: 'dd.MM.yyyy HH:mm',
    importMap: { baseDir: path.resolve(dirname) },
    livePreview: {
      breakpoints: [
        { label: 'Smartphone', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  i18n: {
    supportedLanguages: { de },
    fallbackLanguage: 'de',
  },
  localization: {
    locales: LOCALES.map(({ code, label }) => ({ code, label })),
    defaultLocale: DEFAULT_LOCALE,
    // Keine stille Ersatzsprache: fehlt die Leichte-Sprache-Fassung, wird keine angezeigt.
    fallback: false,
  },
  collections: [Pages, Posts, Events, People, Media, Documents, Categories, Users],
  globals: [Header, Footer],
  editor: richTextEditor,
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, '../../../packages/shared/src/payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Im Container (NODE_ENV=production) werden ausstehende Migrationen beim Start ausgeführt.
    prodMigrations: migrations,
  }),
  jobs: {
    // Für zeitgesteuertes Veröffentlichen (schedulePublish)
    autoRun: [{ cron: '* * * * *', queue: 'default' }],
  },
})
