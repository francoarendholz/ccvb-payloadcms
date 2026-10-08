/**
 * Formular-Endpunkt (on demand). Prüft Eingaben gegen die Formulardefinition im CMS,
 * filtert Bots (Honeypot, Rate-Limit) und legt einen Formular-Eingang an.
 * Ohne JavaScript: normales POST mit Weiterleitung (303) auf die Danke-Seite.
 */
import type { APIRoute } from 'astro'
import type { Form } from '@ccvb/shared/payload-types'

import { LOCALES, sectionPath, t, type LocaleCode } from '@/i18n'
import { env } from '@/lib/env'
import { loadPagePaths, referenceHref } from '@/lib/links'

export const prerender = false

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

const rateLimited = (ip: string) => {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((ts) => now - ts < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 10_000) hits.clear()
  return recent.length > MAX_PER_WINDOW
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Einfache Fehlerseite (ohne JS erreichbar), Zurück-Link führt zum Formular. */
const errorPage = (locale: LocaleCode, back: string, errors: string[], status = 400) =>
  new Response(
    `<!doctype html><html lang="${locale === 'en' ? 'en' : 'de'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escape(t(locale).formError)}</title>
<style>body{font:1.125rem/1.6 system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;color:#1e1e1c}a{color:#bd131e}</style></head>
<body><main><h1>${escape(t(locale).formError)}</h1>${errors.length ? `<ul>${errors.map((e) => `<li>${escape(e)}</li>`).join('')}</ul>` : ''}
<p><a href="${escape(back)}">${locale === 'en' ? 'Back to the form' : 'Zurück zum Formular'}</a></p></main></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const data = await request.formData()
  const str = (key: string) => String(data.get(key) ?? '').trim()
  const locale = (LOCALES.find((l) => l.code === str('_locale'))?.code ?? 'de') as LocaleCode
  const page = str('_page').startsWith('/') ? str('_page') : '/'
  const thanks = sectionPath(locale, 'thanks')

  // Honeypot ausgefüllt → so tun, als hätte alles geklappt.
  if (str('_website')) return redirect(thanks, 303)
  if (rateLimited(request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress)) {
    return errorPage(locale, page, [], 429)
  }

  const formId = Number(str('_form'))
  const res = await fetch(`${env.cmsUrl}/api/forms/${formId}?depth=1&locale=${locale}`).catch(() => null)
  if (!formId || !res?.ok) return errorPage(locale, page, [], 502)
  const form = (await res.json()) as Form

  const errors: string[] = []
  const submissionData: { field: string; value: string }[] = []
  for (const field of form.fields ?? []) {
    if (field.blockType === 'message') continue
    const value = str(field.name).slice(0, 5000)
    const label = field.label || field.name
    if (field.required && !value) errors.push(`${label}: ${t(locale).required}`)
    else if (value && field.blockType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`${label}: ${locale === 'en' ? 'invalid email address' : 'ungültige E-Mail-Adresse'}`)
    else if (value && field.blockType === 'select' && !(field.options ?? []).some((o) => o.value === value)) errors.push(`${label}: ${locale === 'en' ? 'invalid choice' : 'ungültige Auswahl'}`)
    if (value) submissionData.push({ field: field.name, value })
  }
  if (errors.length) return errorPage(locale, page, errors)

  const saved = await fetch(`${env.cmsUrl}/api/form-submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ form: form.id, submissionData }),
  }).catch(() => null)
  if (!saved?.ok) return errorPage(locale, page, [], 502)

  if (form.confirmationType === 'redirect') {
    if (form.redirect?.type === 'custom' && form.redirect.url) return redirect(form.redirect.url, 303)
    await loadPagePaths()
    const href = referenceHref(locale, form.redirect?.reference ?? null)
    if (href) return redirect(href, 303)
  }
  return redirect(thanks, 303)
}
