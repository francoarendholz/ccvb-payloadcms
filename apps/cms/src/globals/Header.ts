import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { link } from '@/fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Navigation',
  admin: { group: 'Einstellungen' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: 'mainNav',
      type: 'array',
      label: 'Hauptnavigation',
      labels: { singular: 'Menüpunkt', plural: 'Menüpunkte' },
      localized: true,
      maxRows: 8,
      admin: {
        initCollapsed: true,
        description: 'Hauptbereiche mit Unterpunkten (Mega-Menü). Pro Sprache eigene Navigation.',
      },
      fields: [
        link({ appearances: false }),
        {
          name: 'children',
          type: 'array',
          label: 'Unterpunkte',
          labels: { singular: 'Unterpunkt', plural: 'Unterpunkte' },
          admin: { initCollapsed: true },
          fields: [link({ appearances: false })],
        },
      ],
    },
    {
      name: 'serviceNav',
      type: 'array',
      label: 'Servicelinks (oben rechts)',
      labels: { singular: 'Link', plural: 'Links' },
      localized: true,
      maxRows: 5,
      admin: { initCollapsed: true },
      fields: [link({ appearances: false })],
    },
  ],
}
