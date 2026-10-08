import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'
import { link } from '@/fields/link'
import { simpleTextEditor } from '@/fields/lexical'

export const ImageTextBlock: Block = {
  slug: 'imageText',
  interfaceName: 'ImageTextBlock',
  labels: { singular: 'Bild + Text', plural: 'Bild + Text' },
  fields: [
    blockHeading(true),
    { name: 'content', type: 'richText', label: 'Text', editor: simpleTextEditor },
    { name: 'media', type: 'upload', relationTo: 'media', label: 'Bild', required: true },
    {
      name: 'imagePosition',
      type: 'radio',
      label: 'Bildposition',
      defaultValue: 'left',
      options: [
        { label: 'Links', value: 'left' },
        { label: 'Rechts', value: 'right' },
      ],
      admin: { layout: 'horizontal' },
    },
    { name: 'enableLink', type: 'checkbox', label: 'Link anzeigen' },
    link({
      appearances: false,
      overrides: { admin: { condition: (_, siblingData) => Boolean(siblingData?.enableLink) } },
    }),
  ],
}
