import type { Block } from 'payload'

import { richTextEditor } from '@/fields/lexical'

export const TextBlock: Block = {
  slug: 'text',
  interfaceName: 'TextBlock',
  labels: { singular: 'Text', plural: 'Texte' },
  fields: [
    {
      name: 'content',
      type: 'richText',
      label: 'Inhalt',
      editor: richTextEditor,
      required: true,
    },
  ],
}
