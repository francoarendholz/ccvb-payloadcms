import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'

export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Bildergalerie', plural: 'Bildergalerien' },
  fields: [
    blockHeading(),
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      label: 'Bilder',
    },
  ],
}
