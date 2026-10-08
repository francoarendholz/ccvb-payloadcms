import type { CollectionConfig } from 'payload'

import { ROLES } from '@ccvb/shared'
import { hasRole, isAdmin, isAdminField } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Benutzer*in', plural: 'Benutzer*innen' },
  admin: {
    group: 'Einstellungen',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
  },
  auth: {
    // API-Keys für Dienstkonten (z. B. Entwurfsvorschau im Frontend)
    useAPIKey: true,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    create: isAdmin,
    delete: isAdmin,
    // Alle Angemeldeten sehen die Kolleg*innen (z. B. für die Auswahl bei der Gegenprüfung)
    read: ({ req: { user } }) => Boolean(user),
    // Ändern: nur das eigene Profil, Admins alle
    update: ({ req: { user } }) => (hasRole(user, 'admin') ? true : { id: { equals: user?.id } }),
  },
  fields: [
    { name: 'name', type: 'text', label: 'Name', required: true },
    {
      name: 'roles',
      type: 'select',
      label: 'Rollen',
      hasMany: true,
      required: true,
      defaultValue: ['autor'],
      saveToJWT: true,
      options: ROLES.map(({ value, label }) => ({ value, label })),
      access: { update: isAdminField, create: isAdminField },
      admin: {
        description:
          'Autor*innen erstellen Entwürfe, die Redaktion veröffentlicht, Administration verwaltet Zugänge und Einstellungen.',
      },
    },
  ],
  timestamps: true,
}
