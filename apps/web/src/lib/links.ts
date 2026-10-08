import type { Document, Event, Page, Post } from '@ccvb/shared/payload-types'

import { DEFAULT_LOCALE, localePath, sectionPath, type LocaleCode } from '@/i18n'
import { findAll, hasLocale } from './cms'
import { documentUrl } from './media'

/** Slug der Startseite im CMS. */
export const HOME_SLUG = 'home'

/** URL-Pfad einer Seite ohne Sprachpräfix, aus den Breadcrumbs (nested-docs). */
export const pagePathOf = (page: Pick<Page, 'slug' | 'breadcrumbs'>): string => {
  if (page.slug === HOME_SLUG) return ''
  const crumbs = page.breadcrumbs
  return crumbs?.length ? crumbs[crumbs.length - 1].url || '' : page.slug
}

// Pfade aller Seiten (aus der deutschen Fassung). Slugs sind nicht übersetzt, die Breadcrumbs
// aber schon – fehlt einer Seite eine Sprachfassung, kennen wir ihren Pfad trotzdem.
const pagePaths = new Map<number, string>()

/** Vor dem Rendern einmal aufrufen (Route-Frontmatter), damit Links auf Seiten auflösbar sind. */
export async function loadPagePaths() {
  if (pagePaths.size) return
  for (const page of await findAll('pages', { locale: DEFAULT_LOCALE, depth: 0 })) {
    if (hasLocale(page)) pagePaths.set(page.id, pagePathOf(page))
  }
}

export const pageHref = (locale: LocaleCode, page: Pick<Page, 'slug' | 'breadcrumbs'>) =>
  localePath(locale, pagePathOf(page))

type Reference =
  | { relationTo: 'pages'; value: number | Page }
  | { relationTo: 'posts'; value: number | Post }
  | { relationTo: 'events'; value: number | Event }
  | { relationTo: 'documents'; value: number | Document }

/**
 * href für einen internen Verweis. Nicht aufgelöste Verweise (z. B. unveröffentlicht) → null.
 * Fehlt dem Ziel die Fassung in dieser Sprache, wird auf die deutsche Fassung verlinkt.
 */
export const referenceHref = (locale: LocaleCode, ref: Reference | null | undefined): string | null => {
  const value = ref?.value
  if (!ref || !value || typeof value !== 'object') return null
  const missing = ref.relationTo !== 'documents' && !hasLocale(value as { title?: string | null })
  const target = missing ? DEFAULT_LOCALE : locale
  switch (ref.relationTo) {
    case 'pages': {
      const page = value as Page
      if (target === locale) return pageHref(locale, page)
      const path = pagePaths.get(page.id)
      return path === undefined ? null : localePath(target, path)
    }
    case 'posts':
      return sectionPath(target, 'posts', (value as Post).slug)
    case 'events':
      return sectionPath(target, 'events', (value as Event).slug)
    case 'documents':
      return documentUrl(value as Document)
  }
}

export type LinkField = {
  type?: ('reference' | 'custom') | null
  newTab?: boolean | null
  reference?: Reference | null
  url?: string | null
  label?: string | null
  appearance?: ('primary' | 'secondary') | null
}

export type ResolvedLink = {
  href: string
  label: string
  newTab: boolean
  external: boolean
  appearance: 'primary' | 'secondary'
}

export const isExternal = (href: string) => /^https?:\/\//.test(href)

export const resolveLink = (locale: LocaleCode, link: LinkField | null | undefined): ResolvedLink | null => {
  if (!link) return null
  const href = link.type === 'custom' ? link.url : referenceHref(locale, link.reference as Reference)
  if (!href) return null
  const target = link.reference?.value
  const fallbackLabel = target && typeof target === 'object' && 'title' in target ? target.title : ''
  return {
    href,
    label: link.label || fallbackLabel || href,
    newTab: Boolean(link.newTab),
    external: isExternal(href),
    appearance: link.appearance ?? 'primary',
  }
}

/** Trailing-Slash-unabhängiger Vergleich für „aktuelle Seite“. */
export const samePath = (a: string, b: string) => a.replace(/\/+$/, '') === b.replace(/\/+$/, '')
