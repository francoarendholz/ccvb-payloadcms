/**
 * Weiterleitungen aus dem CMS (Redirects-Plugin) als JSON. Der Builder im Web-Container
 * beantwortet damit alle Anfragen, für die Caddy keine Datei findet (301/302 oder 404-Seite).
 */
import type { APIRoute } from 'astro'

import { DEFAULT_LOCALE } from '@/i18n'
import { findAll } from '@/lib/cms'
import { loadPagePaths, referenceHref } from '@/lib/links'

export const GET: APIRoute = async () => {
  await loadPagePaths()
  const redirects = await findAll('redirects', { locale: DEFAULT_LOCALE, depth: 1 })
  const map: Record<string, { to: string; status: number }> = {}
  for (const r of redirects) {
    const to = r.to?.type === 'custom' ? r.to.url : referenceHref(DEFAULT_LOCALE, r.to?.reference as never)
    const from = r.from.trim().replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '') || '/'
    if (to) map[from.startsWith('/') ? from : `/${from}`] = { to, status: Number(r.type) || 301 }
  }
  return new Response(JSON.stringify(map), { headers: { 'Content-Type': 'application/json' } })
}
