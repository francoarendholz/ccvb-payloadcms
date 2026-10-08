import type { ArrayField, Field } from 'payload'

import deepMerge from '@/utilities/deepMerge'
import { link, type LinkAppearance } from './link'

export const linkGroup = ({
  appearances,
  overrides = {},
}: { appearances?: LinkAppearance[] | false; overrides?: Partial<ArrayField> } = {}): Field =>
  deepMerge<ArrayField, Partial<ArrayField>>(
    {
      name: 'links',
      type: 'array',
      label: 'Links',
      labels: { singular: 'Link', plural: 'Links' },
      fields: [link({ appearances })],
      admin: { initCollapsed: true },
    },
    overrides,
  )
