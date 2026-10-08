import type { TextField } from 'payload'

/** Optionale Blocküberschrift – wird im Frontend immer als H2 ausgegeben. */
export const blockHeading = (required = false): TextField => ({
  name: 'heading',
  type: 'text',
  label: 'Überschrift',
  required,
  admin: { description: 'Wird als Zwischenüberschrift (H2) angezeigt.' },
})
