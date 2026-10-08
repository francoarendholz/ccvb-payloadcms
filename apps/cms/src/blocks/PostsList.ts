import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'
import { areaField } from '@/fields/area'

export const PostsListBlock: Block = {
  slug: 'postsList',
  interfaceName: 'PostsListBlock',
  labels: { singular: 'Liste: Aktuelles', plural: 'Listen: Aktuelles' },
  fields: [
    blockHeading(),
    areaField({
      admin: { description: 'Leer lassen für alle Bereiche.' },
    }),
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Nur diese Kategorien',
      filterOptions: { type: { equals: 'posts' } },
    },
    { name: 'limit', type: 'number', label: 'Anzahl', defaultValue: 3, min: 1, max: 12 },
  ],
}
