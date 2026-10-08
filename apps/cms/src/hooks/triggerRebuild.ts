import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

/**
 * Stößt den Neubau der statischen Website an (Builder im Web-Container bündelt die Anfragen).
 * Ohne REBUILD_URL (lokale Entwicklung) passiert nichts.
 */
export function requestRebuild(req: PayloadRequest, reason: string) {
  const url = process.env.REBUILD_URL
  if (!url) return
  // Nicht auf die Antwort warten: Speichern im CMS darf nie am Builder hängen.
  fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.REBUILD_TOKEN || ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => {
      if (!res.ok) req.payload.logger.warn(`Rebuild-Anfrage abgelehnt: ${res.status}`)
    })
    .catch((err) => req.payload.logger.warn(`Rebuild-Anfrage fehlgeschlagen: ${err}`))
}

const isDraftSave = (req: PayloadRequest) =>
  String(req.query?.draft) === 'true' || String(req.query?.autosave) === 'true'

/**
 * Nur Änderungen am veröffentlichten Stand lösen einen Neubau aus: Veröffentlichen,
 * Ändern einer veröffentlichten Fassung und Zurückziehen. Entwürfe und Autosaves nicht.
 * Collections ohne Entwürfe (Bilder, Personen …) lösen bei jeder Änderung aus.
 */
export const rebuildAfterChange: CollectionAfterChangeHook = ({ collection, doc, previousDoc, req }) => {
  const hasDrafts = Boolean(collection.versions?.drafts)
  if (hasDrafts) {
    if (isDraftSave(req)) return doc
    const touchesLive = doc?._status === 'published' || previousDoc?._status === 'published'
    if (!touchesLive) return doc
  }
  requestRebuild(req, `${collection.slug}/${doc?.id} geändert`)
  return doc
}

export const rebuildAfterDelete: CollectionAfterDeleteHook = ({ collection, doc, req }) => {
  requestRebuild(req, `${collection.slug}/${doc?.id} gelöscht`)
  return doc
}

export const rebuildAfterGlobalChange: GlobalAfterChangeHook = ({ global, doc, req }) => {
  requestRebuild(req, `${global.slug} geändert`)
  return doc
}
