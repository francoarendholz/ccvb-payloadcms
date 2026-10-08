import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'
import { link } from '@/fields/link'

/** Kachelraster für Schnellzugriffe (wie auf cheersport.de). */
export const CardGridBlock: Block = {
  slug: 'cardGrid',
  interfaceName: 'CardGridBlock',
  labels: { singular: 'Kachelraster', plural: 'Kachelraster' },
  fields: [
    blockHeading(),
    {
      name: 'cards',
      type: 'array',
      label: 'Kacheln',
      labels: { singular: 'Kachel', plural: 'Kacheln' },
      minRows: 1,
      maxRows: 12,
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'Titel', required: true },
        { name: 'text', type: 'textarea', label: 'Kurztext' },
        { name: 'media', type: 'upload', relationTo: 'media', label: 'Bild' },
        link({ appearances: false, disableLabel: true }),
      ],
    },
  ],
}
