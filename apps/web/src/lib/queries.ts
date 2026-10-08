import type { Category } from '@ccvb/shared/payload-types'

import { isoDay, type LocaleCode } from '@/i18n'
import { find, findAll, hasLocale, type Where } from './cms'

type ListFilter = {
  locale: LocaleCode
  area?: string | null
  categories?: (number | Category)[] | null
  limit?: number
}

const ids = (list?: (number | { id: number })[] | null) =>
  (list ?? []).map((c) => (typeof c === 'object' ? c.id : c))

const and = (...conditions: (Where | false | null | undefined)[]): Where | undefined => {
  const list = conditions.filter(Boolean) as Where[]
  return list.length ? { and: list } : undefined
}

export async function latestPosts({ locale, area, categories, limit = 3 }: ListFilter) {
  const categoryIds = ids(categories)
  const res = await find('posts', {
    locale,
    depth: 1,
    // Etwas mehr laden, falls einzelne Beiträge keine Fassung in dieser Sprache haben.
    limit: limit * 2,
    sort: '-publishedAt',
    where: and(Boolean(area) && { area: { equals: area } }, categoryIds.length > 0 && { categories: { in: categoryIds.join(',') } }),
  })
  return res.docs.filter(hasLocale).slice(0, limit)
}

/** Beginn des heutigen Tages (Berliner Zeit) – zur Build-Zeit. */
const todayStart = () => new Date(`${isoDay(new Date().toISOString())}T00:00:00`).toISOString()

/**
 * Kommende und laufende Termine. Die Website ist statisch: Der nächtliche Rebuild
 * sorgt dafür, dass vergangene Termine aus den Listen verschwinden.
 */
export async function upcomingEvents({ locale, area, limit }: Omit<ListFilter, 'categories'>) {
  const since = todayStart()
  const where = and(Boolean(area) && { area: { equals: area } }, {
    or: [{ startDate: { greater_than_equal: since } }, { endDate: { greater_than_equal: since } }],
  })
  const docs = limit
    ? (await find('events', { locale, depth: 1, limit: limit * 2, sort: 'startDate', where })).docs
    : await findAll('events', { locale, depth: 1, sort: 'startDate', where })
  return docs.filter(hasLocale).slice(0, limit ?? undefined)
}

export async function pastEvents({ locale, limit = 20 }: { locale: LocaleCode; limit?: number }) {
  const since = todayStart()
  const res = await find('events', {
    locale,
    depth: 1,
    limit: limit * 2,
    sort: '-startDate',
    where: and({ startDate: { less_than: since } }, {
      or: [{ endDate: { less_than: since } }, { endDate: { exists: false } }],
    }),
  })
  return res.docs.filter(hasLocale).slice(0, limit)
}

export async function documents({ locale, area, categories }: Omit<ListFilter, 'limit'>) {
  const categoryIds = ids(categories)
  const docs = await findAll('documents', {
    locale,
    depth: 1,
    sort: 'title',
    where: and(Boolean(area) && { area: { equals: area } }, categoryIds.length > 0 && { category: { in: categoryIds.join(',') } }),
  })
  return docs.filter(hasLocale)
}
