import type { SelectField } from 'payload'

import { AREAS } from '@ccvb/shared'

/** Zuordnung zu einem Verbandsbereich – darüber erscheinen Inhalte automatisch auf den Bereichsseiten. */
export const areaField = (overrides: Partial<SelectField> = {}): SelectField =>
  ({
    name: 'area',
    type: 'select',
    label: 'Bereich',
    options: AREAS.map(({ value, label }) => ({ value, label })),
    admin: {
      position: 'sidebar',
      description: 'Inhalt erscheint automatisch auf der Seite dieses Bereichs.',
    },
    ...overrides,
  }) as SelectField
