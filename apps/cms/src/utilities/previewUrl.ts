import type { CollectionSlug, PayloadRequest } from 'payload'

/**
 * Vorschau-Link ins Astro-Frontend (SSR-Route /preview). Läuft über die Dokument-ID,
 * damit auch Entwürfe ohne finalen Slug angezeigt werden können.
 */
export const previewUrl = ({
  collection,
  id,
  req,
}: {
  collection: CollectionSlug
  id?: number | string | null
  req: PayloadRequest
}): string | null => {
  if (!id) return null
  const params = new URLSearchParams({
    token: process.env.PREVIEW_SECRET || '',
    locale: req.locale || 'de',
  })
  return `${process.env.WEB_URL || ''}/preview/${collection}/${id}?${params.toString()}`
}
