import type { Field, SelectField } from 'payload'

import { hasRole } from '@/access'

export const REVIEW_STATUS = [
  { label: 'In Bearbeitung', value: 'in_progress' },
  { label: 'Zur Prüfung eingereicht', value: 'review' },
  { label: 'Überarbeitung erbeten', value: 'changes_requested' },
] as const

const reviewStatusField: SelectField = {
  name: 'reviewStatus',
  type: 'select',
  label: 'Prüfstatus',
  defaultValue: 'in_progress',
  options: [...REVIEW_STATUS],
  index: true,
  admin: {
    position: 'sidebar',
    description:
      'Autor*innen: Wenn der Inhalt fertig ist, auf „Zur Prüfung eingereicht“ stellen.',
  },
}

/** Freigabe-Workflow: Autor*innen reichen ein, die Redaktion prüft und veröffentlicht. */
export const reviewFields: Field[] = [
  reviewStatusField,
  {
    name: 'reviewNote',
    type: 'textarea',
    label: 'Hinweis der Redaktion',
    admin: {
      position: 'sidebar',
      condition: (data) => data?.reviewStatus === 'changes_requested' || Boolean(data?.reviewNote),
    },
    access: {
      update: ({ req }) => hasRole(req.user, 'admin', 'redaktion'),
    },
  },
  {
    name: 'submittedBy',
    type: 'relationship',
    relationTo: 'users',
    label: 'Eingereicht von',
    admin: {
      position: 'sidebar',
      readOnly: true,
      condition: (data) => Boolean(data?.submittedBy),
    },
  },
]
