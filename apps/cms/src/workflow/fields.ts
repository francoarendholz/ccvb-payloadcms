import type { Field } from 'payload'

export const REVIEW_STATUS = [
  { label: '–', value: 'none' },
  { label: 'Zur Prüfung eingereicht', value: 'review' },
  { label: 'Überarbeitung erbeten', value: 'changes_requested' },
  { label: 'Geprüft – kann veröffentlicht werden', value: 'approved' },
] as const

/**
 * Optionale Gegenprüfung (Vier-Augen-Prinzip): Wer möchte, reicht zur Prüfung ein; eine andere
 * Person gibt Rückmeldung. Veröffentlichen können alle – auch ohne Prüfung.
 */
export const reviewFields: Field[] = [
  {
    type: 'collapsible',
    label: 'Gegenprüfung (optional)',
    admin: {
      position: 'sidebar',
      initCollapsed: false,
      description:
        'Soll jemand noch einmal drüberschauen? Status auf „Zur Prüfung eingereicht“ setzen und optional eine Person auswählen.',
    },
    fields: [
      {
        name: 'reviewStatus',
        type: 'select',
        label: 'Status',
        defaultValue: 'none',
        options: [...REVIEW_STATUS],
        index: true,
      },
      {
        name: 'reviewer',
        type: 'relationship',
        relationTo: 'users',
        label: 'Prüfen soll',
        admin: {
          description: 'Leer lassen = jemand aus der Redaktion.',
          condition: (data) => data?.reviewStatus && data.reviewStatus !== 'none',
        },
        filterOptions: ({ user }) => (user ? { id: { not_equals: user.id } } : true),
      },
      {
        name: 'reviewNote',
        type: 'textarea',
        label: 'Rückmeldung',
        admin: {
          condition: (data) =>
            data?.reviewStatus === 'changes_requested' ||
            data?.reviewStatus === 'approved' ||
            Boolean(data?.reviewNote),
        },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'submittedBy',
            type: 'relationship',
            relationTo: 'users',
            label: 'Eingereicht von',
            admin: { readOnly: true, condition: (data) => Boolean(data?.submittedBy) },
          },
          {
            name: 'reviewedBy',
            type: 'relationship',
            relationTo: 'users',
            label: 'Geprüft von',
            admin: { readOnly: true, condition: (data) => Boolean(data?.reviewedBy) },
          },
        ],
      },
    ],
  },
]
