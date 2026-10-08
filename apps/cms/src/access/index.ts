import type { Access, FieldAccess } from 'payload'

import type { Role } from '@ccvb/shared'

type UserWithRole = { roles?: Role[] | null } | null | undefined

export const hasRole = (user: UserWithRole, ...roles: Role[]): boolean =>
  Boolean(user?.roles?.some((role) => roles.includes(role)))

export const anyone: Access = () => true

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Öffentlich nur veröffentlichte Dokumente, angemeldet alles (inkl. Entwürfe). */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin')

/** Redaktion und Administration. */
export const isEditor: Access = ({ req: { user } }) => hasRole(user, 'admin', 'redaktion')

export const isAdminField: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin')
