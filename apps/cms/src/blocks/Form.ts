import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'

export const FormBlock: Block = {
  slug: 'formBlock',
  interfaceName: 'FormBlock',
  labels: { singular: 'Formular', plural: 'Formulare' },
  fields: [
    blockHeading(),
    { name: 'intro', type: 'textarea', label: 'Einleitung' },
    { name: 'form', type: 'relationship', relationTo: 'forms', label: 'Formular', required: true },
  ],
}
