import type { CollectionConfig } from 'payload'
import path from 'path'

import { anyone, authenticated, isEditor } from '@/access'
import { areaField } from '@/fields/area'

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Dokument', plural: 'Dokumente' },
  admin: {
    group: 'Medien & Dateien',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'area', 'validFrom', 'updatedAt'],
    description: 'PDFs und andere Dateien zum Herunterladen (Satzung, Protokolle, Regelwerke …).',
  },
  folders: true,
  access: { create: authenticated, read: anyone, update: authenticated, delete: isEditor },
  fields: [
    { name: 'title', type: 'text', label: 'Titel', required: true, localized: true },
    { name: 'description', type: 'textarea', label: 'Kurzbeschreibung', localized: true },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Kategorie',
      filterOptions: { type: { equals: 'documents' } },
      admin: { position: 'sidebar' },
    },
    areaField(),
    {
      name: 'validFrom',
      type: 'date',
      label: 'Gültig ab / Stand',
      admin: { position: 'sidebar', date: { displayFormat: 'dd.MM.yyyy' } },
    },
  ],
  upload: {
    staticDir: path.resolve(process.env.MEDIA_DIR || 'media', 'documents'),
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
    ],
  },
}
