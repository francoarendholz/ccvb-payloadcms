import type { Access, FieldAccess, Where } from 'payload'
import { totpAccess } from 'payload-totp'

import type { Role } from '@ccvb/shared'

type UserWithRole = { roles?: Role[] | null } | null | undefined

export const hasRole = (user: UserWithRole, ...roles: Role[]): boolean =>
  Boolean(user?.roles?.some((role) => roles.includes(role)))

export const anyone: Access = () => true

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin')

/** Redaktion und Administration. */
export const isEditor: Access = ({ req: { user } }) => hasRole(user, 'admin', 'redaktion')

export const isAdminField: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin')

const publishedOnly: Where = { _status: { equals: 'published' } }

/**
 * Lesen für redaktionelle Inhalte: Besucher*innen (und der Astro-Build) sehen nur Veröffentlichtes.
 * Entwürfe sieht nur, wer angemeldet ist und – falls aktiv – den TOTP-Code bestätigt hat.
 * In der Collection wird der automatische TOTP-Wrapper für `read` deaktiviert, weil wir ihn hier
 * selbst anwenden und ein anonymer Zugriff sonst komplett gesperrt wäre.
 */
export const publishedOrVerified: Access = async (args) => {
  if (!args.req.user) return publishedOnly
  const result = await totpAccess(() => true)(args)
  return result === false ? publishedOnly : result
}

/** Öffentlich lesbar trotz TOTP-Plugin (Bilder, Navigation, Kategorien …). */
export const publicRead = { totp: { disableAccessWrapper: { read: true } } }
