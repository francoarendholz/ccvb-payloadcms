import type { CollectionConfig } from 'payload'

import { anyone, authenticated, isEditor, publicRead } from '@/access'
import { areaField } from '@/fields/area'

/** Ansprechpersonen – einmal pflegen, auf beliebig vielen Seiten verwenden. */
export const People: CollectionConfig = {
  slug: 'people',
  labels: { singular: 'Person', plural: 'Personen' },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'area'],
  },
  custom: publicRead,
  access: { create: authenticated, read: anyone, update: authenticated, delete: isEditor },
  fields: [
    { name: 'name', type: 'text', label: 'Name', required: true },
    { name: 'role', type: 'text', label: 'Funktion', localized: true },
    { name: 'email', type: 'email', label: 'E-Mail' },
    { name: 'phone', type: 'text', label: 'Telefon' },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Foto' },
    areaField(),
    {
      name: 'sort',
      type: 'number',
      label: 'Sortierung',
      admin: { position: 'sidebar', description: 'Kleinere Zahl = weiter oben.' },
    },
  ],
}
