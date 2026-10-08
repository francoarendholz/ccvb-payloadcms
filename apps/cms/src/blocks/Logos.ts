import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'

export const LogosBlock: Block = {
  slug: 'logos',
  interfaceName: 'LogosBlock',
  labels: { singular: 'Logoleiste (Partner)', plural: 'Logoleisten' },
  fields: [
    blockHeading(),
    {
      name: 'logos',
      type: 'array',
      label: 'Logos',
      labels: { singular: 'Logo', plural: 'Logos' },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          admin: { description: 'Wird als Alternativtext für das Logo verwendet.' },
        },
        { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo', required: true },
        { name: 'url', type: 'text', label: 'Website' },
      ],
    },
  ],
}
