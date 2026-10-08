import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'
import { linkGroup } from '@/fields/linkGroup'

export const CallToActionBlock: Block = {
  slug: 'cta',
  interfaceName: 'CallToActionBlock',
  labels: { singular: 'Handlungsaufruf', plural: 'Handlungsaufrufe' },
  fields: [
    blockHeading(true),
    { name: 'text', type: 'textarea', label: 'Text' },
    linkGroup({ overrides: { maxRows: 2, minRows: 1 } }),
  ],
}
