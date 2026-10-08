import { slugField, type CollectionConfig } from 'payload'

import { anyone, isEditor, publicRead } from '@/access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Kategorie', plural: 'Kategorien' },
  admin: {
    group: 'Einstellungen',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type'],
  },
  custom: publicRead,
  access: { create: isEditor, read: anyone, update: isEditor, delete: isEditor },
  fields: [
    { name: 'title', type: 'text', label: 'Titel', required: true, localized: true },
    {
      name: 'type',
      type: 'select',
      label: 'Verwendet für',
      required: true,
      defaultValue: 'posts',
      options: [
        { label: 'Aktuelles', value: 'posts' },
        { label: 'Downloads', value: 'documents' },
      ],
    },
    slugField({ position: undefined }),
  ],
}
