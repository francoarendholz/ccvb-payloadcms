import type { Block } from 'payload'

export const ImageBlock: Block = {
  slug: 'image',
  interfaceName: 'ImageBlock',
  labels: { singular: 'Bild', plural: 'Bilder' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', label: 'Bild', required: true },
    {
      name: 'caption',
      type: 'text',
      label: 'Bildunterschrift',
      admin: { description: 'Optional, sichtbar unter dem Bild.' },
    },
    {
      name: 'width',
      type: 'select',
      label: 'Breite',
      defaultValue: 'content',
      options: [
        { label: 'Textbreite', value: 'content' },
        { label: 'Volle Breite', value: 'wide' },
      ],
    },
  ],
}
