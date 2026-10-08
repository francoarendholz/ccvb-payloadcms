import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'

export const ContactsBlock: Block = {
  slug: 'contacts',
  interfaceName: 'ContactsBlock',
  labels: { singular: 'Ansprechpersonen', plural: 'Ansprechpersonen' },
  fields: [
    blockHeading(),
    {
      name: 'people',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      required: true,
      label: 'Personen',
      admin: { description: 'Personen werden zentral unter „Personen“ gepflegt.' },
    },
  ],
}
