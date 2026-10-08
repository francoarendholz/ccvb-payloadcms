/** Bereiche des Verbands – steuern Navigation und automatische Zuordnung von Inhalten. */
export const AREAS = [
  { value: 'verband', label: 'Verband' },
  { value: 'jugend', label: 'Jugend' },
  { value: 'wettkaempfe', label: 'Wettkämpfe' },
  { value: 'bildung', label: 'Bildung' },
  { value: 'leistungssport', label: 'Leistungssport' },
  { value: 'vielfalt', label: 'Vielfalt' },
] as const

export type Area = (typeof AREAS)[number]['value']

/**
 * Sprachfassungen. `ls` = Leichte Sprache (HTML-lang bleibt "de").
 * `prefix` ist das URL-Präfix im Frontend.
 */
export const LOCALES = [
  { code: 'de', label: 'Deutsch', htmlLang: 'de', prefix: '' },
  { code: 'ls', label: 'Leichte Sprache', htmlLang: 'de', prefix: '/leichte-sprache' },
  { code: 'en', label: 'English', htmlLang: 'en', prefix: '/en' },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

export const DEFAULT_LOCALE: LocaleCode = 'de'

export const ROLES = [
  { value: 'admin', label: 'Administration' },
  { value: 'redaktion', label: 'Redaktion' },
  { value: 'autor', label: 'Autor*in' },
  // Dienstkonto der Website für die Entwurfsvorschau – darf nur lesen, kein Admin-Login.
  { value: 'vorschau', label: 'Vorschau (Dienstkonto, nur lesen)' },
] as const

export type Role = (typeof ROLES)[number]['value']

/** Rollen der Menschen, die im CMS arbeiten (alles außer Dienstkonten). */
export const EDITORIAL_ROLES = ['admin', 'redaktion', 'autor'] as const satisfies readonly Role[]
