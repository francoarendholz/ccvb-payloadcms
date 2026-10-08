import type { Plugin } from 'payload'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'

import { anyone, isEditor, publicRead } from '@/access'

const SITE_NAME = 'CCV Berlin'

export const plugins: Plugin[] = [
  nestedDocsPlugin({
    collections: ['pages'],
    generateLabel: (_, doc) => doc.title as string,
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle: ({ doc }) => (doc?.title ? `${doc.title} | ${SITE_NAME}` : SITE_NAME),
    generateDescription: ({ doc }) => (doc?.excerpt as string) || '',
  }),
  redirectsPlugin({
    collections: ['pages', 'posts', 'events'],
    redirectTypes: ['301', '302'],
    overrides: {
      labels: { singular: 'Weiterleitung', plural: 'Weiterleitungen' },
      admin: { group: 'Einstellungen' },
      // Lesbar für den Astro-Build (erzeugt daraus die Caddy-Weiterleitungen)
      custom: publicRead,
      access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
    },
  }),
  formBuilderPlugin({
    fields: { payment: false, state: false, country: false },
    redirectRelationships: ['pages'],
    formOverrides: {
      labels: { singular: 'Formular', plural: 'Formulare' },
      admin: { group: 'Einstellungen' },
      custom: publicRead,
      access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
    },
    formSubmissionOverrides: {
      labels: { singular: 'Formular-Eingang', plural: 'Formular-Eingänge' },
      admin: { group: 'Einstellungen' },
      // Absenden ohne Login (über den Formular-Endpunkt der Website)
      custom: { totp: { disableAccessWrapper: { create: true } } },
      access: { create: anyone, read: isEditor, update: () => false, delete: isEditor },
    },
  }),
]
