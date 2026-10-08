import type { Document, Media } from '@ccvb/shared/payload-types'

import { env } from './env'

/**
 * Bilder und Dokumente: im Betrieb liefert Caddy sie direkt unter `/media` aus dem
 * Media-Volume aus (`MEDIA_URL`). Ohne `MEDIA_URL` (lokal) über die Datei-Route des CMS.
 */
const fileUrl = (kind: 'images' | 'documents', filename: string) => {
  const name = encodeURIComponent(filename)
  if (env.mediaUrl) return `${env.mediaUrl}/${kind}/${name}`
  const collection = kind === 'images' ? 'media' : 'documents'
  return `${env.cmsUrl}/api/${collection}/file/${name}`
}

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'xlarge'
const SIZE_ORDER: ImageSize[] = ['thumbnail', 'small', 'medium', 'large', 'xlarge']

export type Source = { src: string; width: number; height: number }

/** Alle vorhandenen WebP-Größen bis `max`, aufsteigend sortiert. */
export const imageSources = (media: Media, max: ImageSize = 'xlarge'): Source[] => {
  const sizes = SIZE_ORDER.slice(0, SIZE_ORDER.indexOf(max) + 1)
  const sources = sizes
    .map((name) => media.sizes?.[name])
    .filter((s): s is NonNullable<typeof s> => Boolean(s?.filename && s.width && s.height))
    .map((s) => ({ src: fileUrl('images', s.filename!), width: s.width!, height: s.height! }))
  if (sources.length === 0 && media.filename) {
    sources.push({
      src: fileUrl('images', media.filename),
      width: media.width ?? 0,
      height: media.height ?? 0,
    })
  }
  return sources
}

export const ogImage = (media: Media | null | undefined) =>
  media?.sizes?.og?.filename ? fileUrl('images', media.sizes.og.filename) : undefined

export const documentUrl = (doc: Document) => (doc.filename ? fileUrl('documents', doc.filename) : '#')

const TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'application/zip': 'ZIP',
}

/** „PDF, 1,2 MB“ – Dateityp und Größe gehören zum Linktext (WCAG 2.4.4). */
export const documentMeta = (doc: Document, locale: string) => {
  const type = (doc.mimeType && TYPES[doc.mimeType]) || doc.filename?.split('.').pop()?.toUpperCase() || ''
  const bytes = doc.filesize ?? 0
  const fmt = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'de-DE', { maximumFractionDigits: 1 })
  const size = bytes >= 1024 * 1024 ? `${fmt.format(bytes / 1024 / 1024)} MB` : `${fmt.format(Math.max(1, Math.round(bytes / 1024)))} KB`
  return [type, bytes ? size : ''].filter(Boolean).join(', ')
}
