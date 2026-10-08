import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'
import { simpleTextEditor } from '@/fields/lexical'

export const AccordionBlock: Block = {
  slug: 'accordion',
  interfaceName: 'AccordionBlock',
  labels: { singular: 'Akkordeon / FAQ', plural: 'Akkordeons' },
  fields: [
    blockHeading(),
    {
      name: 'items',
      type: 'array',
      label: 'Einträge',
      labels: { singular: 'Eintrag', plural: 'Einträge' },
      minRows: 1,
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'Frage / Titel', required: true },
        {
          name: 'content',
          type: 'richText',
          label: 'Inhalt',
          editor: simpleTextEditor,
          required: true,
        },
      ],
    },
  ],
}
