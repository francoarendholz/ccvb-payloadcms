import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { de } from '@payloadcms/translations/languages/de'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { payloadTotp, totpAccess } from 'payload-totp'

import { DEFAULT_LOCALE, LOCALES } from '@ccvb/shared'
import { isStaff } from './access'
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
import { ensurePreviewAccount } from './utilities/serviceAccount'

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
    components: {
      beforeDashboard: ['@/components/RebuildStatus#RebuildStatus', '@/components/ReviewQueue#ReviewQueue'],
    },
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
    // Muss true sein, sonst landen Anfragen ohne ?locale= im „alle Sprachen“-Modus.
    // Das Frontend fragt immer mit fallback-locale=none ab: fehlt z. B. die Leichte-Sprache-
    // Fassung, wird sie nicht stillschweigend durch Deutsch ersetzt.
    fallback: true,
  },
  collections: [Pages, Posts, Events, People, Media, Documents, Categories, Users],
  globals: [Header, Footer],
  editor: richTextEditor,
  plugins: [
    ...plugins,
    // Muss das letzte Plugin sein – umhüllt die Zugriffsregeln aller Collections.
    payloadTotp({
      collection: 'users',
      disabled: process.env.TOTP_DISABLED === 'true',
      forceSetup: true,
      totp: { issuer: 'CCVB CMS' },
    }),
  ],
  // Ohne SMTP-Konfiguration landen E-Mails im Log.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'cms@cheersportberlin.de',
        defaultFromName: 'CCVB CMS',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, '../../../packages/shared/src/payload-types.ts'),
    // Die Typen nutzt auch das Frontend (ohne Payload). Die Modul-Erweiterung für die
    // Local API steht deshalb in src/payload-generated.d.ts statt in der generierten Datei.
    declare: false,
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Im Container (NODE_ENV=production) werden ausstehende Migrationen beim Start ausgeführt.
    prodMigrations: migrations,
  }),
  onInit: ensurePreviewAccount,
  jobs: {
    // Für zeitgesteuertes Veröffentlichen (schedulePublish)
    autoRun: [{ cron: '* * * * *', queue: 'default' }],
    access: {
      // Veröffentlichung planen: alle angemeldeten Konten mit bestätigtem TOTP.
      queue: async (args) =>
        isStaff(args.req.user) && (await totpAccess(() => true)(args as never)) === true,
    },
  },
})
