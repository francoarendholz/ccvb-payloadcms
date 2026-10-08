import type { Field, GroupField } from 'payload'

import deepMerge from '@/utilities/deepMerge'

export type LinkAppearance = 'primary' | 'secondary'

const appearanceOptions: Record<LinkAppearance, { label: string; value: LinkAppearance }> = {
  primary: { label: 'Hauptaktion', value: 'primary' },
  secondary: { label: 'Nebenaktion', value: 'secondary' },
}

type LinkOptions = {
  appearances?: LinkAppearance[] | false
  disableLabel?: boolean
  overrides?: Partial<GroupField>
}

/** Interner Verweis (Seite/Beitrag/Termin/Dokument) oder externe URL. */
export const link = ({
  appearances,
  disableLabel = false,
  overrides = {},
}: LinkOptions = {}): Field => {
  const linkResult: GroupField = {
    name: 'link',
    type: 'group',
    label: false,
    admin: { hideGutter: true },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'radio',
            label: 'Linkart',
            admin: { layout: 'horizontal', width: '50%' },
            defaultValue: 'reference',
            options: [
              { label: 'Interner Inhalt', value: 'reference' },
              { label: 'Externe URL', value: 'custom' },
            ],
          },
          {
            name: 'newTab',
            type: 'checkbox',
            label: 'In neuem Tab öffnen',
            admin: {
              style: { alignSelf: 'flex-end' },
              width: '50%',
              description: 'Nur für externe Links verwenden.',
            },
          },
        ],
      },
    ],
  }

  const linkTypes: Field[] = [
    {
      name: 'reference',
      type: 'relationship',
      label: 'Ziel',
      relationTo: ['pages', 'posts', 'events', 'documents'],
      required: true,
      admin: { condition: (_, siblingData) => siblingData?.type === 'reference' },
    },
    {
      name: 'url',
      type: 'text',
      label: 'URL',
      required: true,
      admin: { condition: (_, siblingData) => siblingData?.type === 'custom' },
    },
  ]

  if (disableLabel) {
    linkResult.fields.push(...linkTypes)
  } else {
    linkResult.fields.push({
      type: 'row',
      fields: [
        ...linkTypes.map((field) => ({ ...field, admin: { ...field.admin, width: '50%' } }) as Field),
        {
          name: 'label',
          type: 'text',
          label: 'Linktext',
          required: true,
          admin: {
            width: '50%',
            description: 'Aussagekräftig formulieren – nicht „hier klicken“.',
          },
        },
      ],
    })
  }

  if (appearances !== false) {
    const options = (appearances ?? ['primary', 'secondary']).map((a) => appearanceOptions[a])
    linkResult.fields.push({
      name: 'appearance',
      type: 'select',
      label: 'Darstellung',
      defaultValue: options[0].value,
      options,
    })
  }

  return deepMerge(linkResult, overrides)
}
