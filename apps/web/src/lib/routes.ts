import type { Event, Page, Post } from '@ccvb/shared/payload-types'

import { LOCALES, localePath, sectionPath, type LocaleCode, type Section } from '@/i18n'
import { findAll, hasLocale } from './cms'
import { pagePathOf } from './links'

export const POSTS_PER_PAGE = 12

/** Sprachfassungen einer URL: locale → href. */
export type Alternates = Partial<Record<LocaleCode, string>>

export type Route =
  | { kind: 'page'; doc: Page }
  | { kind: 'post'; doc: Post }
  | { kind: 'event'; doc: Event }
  | { kind: 'postIndex'; page: number; totalPages: number; posts: Post[] }
  | { kind: 'eventIndex' }
  | { kind: 'downloads' }
  | { kind: 'search' }
  | { kind: 'thanks' }

export type RouteProps = { locale: LocaleCode; route: Route; alternates: Alternates }

/** `/en/news/` → `en/news` (Astro-Parameter für `[...path]`, Startseite = undefined). */
const toParam = (href: string) => href.replace(/^\/|\/$/g, '') || undefined

const sectionAlternates = (section: Section, ...rest: string[]): Alternates =>
  Object.fromEntries(LOCALES.map(({ code }) => [code, sectionPath(code, section, ...rest)]))

/**
 * Alle statischen Routen aller Sprachen. Inhalte ohne Fassung in einer Sprache werden
 * für diese Sprache nicht erzeugt; der Sprachumschalter kennt nur vorhandene Fassungen.
 */
export async function buildRoutes() {
  const entries: { href: string; props: RouteProps }[] = []
  const add = (locale: LocaleCode, href: string, route: Route, alternates: Alternates) =>
    entries.push({ href, props: { locale, route, alternates } })

  // Inhalte je Sprache laden
  const byLocale = await Promise.all(
    LOCALES.map(async ({ code }) => {
      const [pages, posts, events] = await Promise.all([
        findAll('pages', { locale: code, depth: 2 }),
        findAll('posts', { locale: code, depth: 2, sort: '-publishedAt' }),
        findAll('events', { locale: code, depth: 2, sort: 'startDate' }),
      ])
      return {
        locale: code,
        pages: pages.filter(hasLocale),
        posts: posts.filter(hasLocale),
        events: events.filter(hasLocale),
      }
    }),
  )

  // Sprachfassungen je Dokument sammeln
  const alt = { pages: new Map<number, Alternates>(), posts: new Map<number, Alternates>(), events: new Map<number, Alternates>() }
  for (const { locale, pages, posts, events } of byLocale) {
    for (const p of pages) alt.pages.set(p.id, { ...alt.pages.get(p.id), [locale]: localePath(locale, pagePathOf(p)) })
    for (const p of posts) alt.posts.set(p.id, { ...alt.posts.get(p.id), [locale]: sectionPath(locale, 'posts', p.slug) })
    for (const e of events) alt.events.set(e.id, { ...alt.events.get(e.id), [locale]: sectionPath(locale, 'events', e.slug) })
  }

  for (const { locale, pages, posts, events } of byLocale) {
    for (const doc of pages) {
      add(locale, localePath(locale, pagePathOf(doc)), { kind: 'page', doc }, alt.pages.get(doc.id)!)
    }
    for (const doc of posts) {
      add(locale, sectionPath(locale, 'posts', doc.slug), { kind: 'post', doc }, alt.posts.get(doc.id)!)
    }
    for (const doc of events) {
      add(locale, sectionPath(locale, 'events', doc.slug), { kind: 'event', doc }, alt.events.get(doc.id)!)
    }

    // Übersicht Aktuelles mit Seitennummerierung: /aktuelles/, /aktuelles/seite/2/
    const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE))
    for (let page = 1; page <= totalPages; page++) {
      const rest = page === 1 ? [] : [pageSegment(locale), String(page)]
      add(
        locale,
        sectionPath(locale, 'posts', ...rest),
        { kind: 'postIndex', page, totalPages, posts: posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE) },
        page === 1 ? sectionAlternates('posts') : { [locale]: sectionPath(locale, 'posts', ...rest) },
      )
    }

    add(locale, sectionPath(locale, 'events'), { kind: 'eventIndex' }, sectionAlternates('events'))
    add(locale, sectionPath(locale, 'downloads'), { kind: 'downloads' }, sectionAlternates('downloads'))
    add(locale, sectionPath(locale, 'search'), { kind: 'search' }, sectionAlternates('search'))
    add(locale, sectionPath(locale, 'thanks'), { kind: 'thanks' }, sectionAlternates('thanks'))
  }

  // Seiten haben Vorrang vor festen Bereichen mit gleicher URL – doppelte URLs vermeiden.
  const seen = new Set<string>()
  return entries
    .filter(({ href }) => (seen.has(href) ? false : (seen.add(href), true)))
    .map(({ href, props }) => ({ params: { path: toParam(href) }, props }))
}

export const pageSegment = (locale: LocaleCode) => (locale === 'en' ? 'page' : 'seite')

