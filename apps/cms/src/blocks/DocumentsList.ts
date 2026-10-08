import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'
import { areaField } from '@/fields/area'

export const DocumentsListBlock: Block = {
  slug: 'documentsList',
  interfaceName: 'DocumentsListBlock',
  labels: { singular: 'Liste: Downloads', plural: 'Listen: Downloads' },
  fields: [
    blockHeading(),
    {
      name: 'populateBy',
      type: 'radio',
      label: 'Auswahl',
      defaultValue: 'filter',
      options: [
        { label: 'Automatisch (Bereich/Kategorie)', value: 'filter' },
        { label: 'Einzelne Dokumente', value: 'selection' },
      ],
      admin: { layout: 'horizontal' },
    },
    areaField({
      admin: { condition: (_, s) => s?.populateBy === 'filter', description: 'Leer = alle.' },
    }),
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Kategorien',
      filterOptions: { type: { equals: 'documents' } },
      admin: { condition: (_, s) => s?.populateBy === 'filter' },
    },
    {
      name: 'documents',
      type: 'relationship',
      relationTo: 'documents',
      hasMany: true,
      label: 'Dokumente',
      admin: { condition: (_, s) => s?.populateBy === 'selection' },
    },
  ],
}
