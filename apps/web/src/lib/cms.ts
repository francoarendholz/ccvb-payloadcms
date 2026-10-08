import type { Config } from '@ccvb/shared/payload-types'

import type { LocaleCode } from '@/i18n'
import { env } from './env'

type Collections = Config['collections']
type Globals = Config['globals']
export type CollectionSlug = keyof Collections
export type GlobalSlug = keyof Globals

export type Where = Record<string, unknown>

type FindOptions = {
  locale: LocaleCode
  where?: Where
  depth?: number
  limit?: number
  page?: number
  sort?: string
  draft?: boolean
}

export type PaginatedDocs<T> = {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
}

/** Serialisiert verschachtelte Objekte im qs-Format, das die Payload-REST-API erwartet. */
const toQuery = (value: unknown, prefix: string, out: URLSearchParams) => {
  if (value === undefined) return
  if (value !== null && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) toQuery(v, `${prefix}[${key}]`, out)
  } else {
    out.append(prefix, String(value))
  }
}

// Während eines Builds wird dieselbe Anfrage (z. B. Navigation, Listen-Blöcke) nur einmal gestellt.
const cache = new Map<string, Promise<unknown>>()

/**
 * GET gegen die Payload-REST-API.
 * Immer mit `locale` und `fallback-locale=none`: fehlt eine Sprachfassung, kommt `null`
 * statt stillschweigend der deutschen Fassung.
 */
async function request<T>(path: string, params: Record<string, unknown>, draft = false): Promise<T> {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (key === 'where') toQuery(value, 'where', search)
    else if (value !== undefined) search.set(key, String(value))
  }
  search.set('fallback-locale', 'none')
  if (draft) search.set('draft', 'true')

  const url = `${env.cmsUrl}/api/${path}?${search}`
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (draft && env.cmsApiKey) headers.Authorization = `users API-Key ${env.cmsApiKey}`

  const load = async () => {
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`CMS ${res.status} bei ${url}: ${await res.text()}`)
    return res.json()
  }
  if (draft) return load() as Promise<T>

  if (!cache.has(url)) cache.set(url, load())
  return cache.get(url) as Promise<T>
}

export const find = <S extends CollectionSlug>(collection: S, opts: FindOptions) =>
  request<PaginatedDocs<Collections[S]>>(
    collection,
    {
      locale: opts.locale,
      where: opts.where,
      depth: opts.depth ?? 1,
      limit: opts.limit ?? 10,
      page: opts.page,
      sort: opts.sort,
    },
    opts.draft,
  )

/** Alle Dokumente (seitenweise geladen). */
export async function findAll<S extends CollectionSlug>(
  collection: S,
  opts: Omit<FindOptions, 'limit' | 'page'>,
): Promise<Collections[S][]> {
  const docs: Collections[S][] = []
  for (let page = 1; ; page++) {
    const res = await find(collection, { ...opts, limit: 100, page })
    docs.push(...res.docs)
    if (!res.hasNextPage) return docs
  }
}

export const findByID = <S extends CollectionSlug>(
  collection: S,
  id: number | string,
  opts: Omit<FindOptions, 'where' | 'limit' | 'page' | 'sort'>,
) =>
  request<Collections[S]>(
    `${collection}/${id}`,
    { locale: opts.locale, depth: opts.depth ?? 2 },
    opts.draft,
  )

export const getGlobal = <S extends GlobalSlug>(slug: S, locale: LocaleCode, depth = 1) =>
  request<Globals[S]>(`globals/${slug}`, { locale, depth })

/** Gibt es eine Fassung in dieser Sprache? (Pflichtfeld `title` ist dann gesetzt.) */
export const hasLocale = (doc: { title?: string | null } | null | undefined) => Boolean(doc?.title)

/** Löst eine Relation auf, die als ID oder als Objekt kommen kann. */
export const resolved = <T extends object>(value: number | string | T | null | undefined): T | null =>
  value && typeof value === 'object' ? value : null
