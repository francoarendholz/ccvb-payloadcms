import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook } from 'payload'

import { hasRole } from '@/access'

const isEditorUser = (user: Parameters<typeof hasRole>[0]) => hasRole(user, 'admin', 'redaktion')

/**
 * Serverseitige Sperre: Nur Redaktion/Administration dürfen veröffentlichen oder
 * die Veröffentlichung zurückziehen. Greift für Admin-UI, REST, GraphQL und Local API
 * (außer bei Systemvorgängen ohne Benutzer, z. B. zeitgesteuertes Veröffentlichen).
 */
export const enforcePublishRights: CollectionBeforeChangeHook = async ({
  collection,
  data,
  operation,
  originalDoc,
  req,
}) => {
  const { user } = req
  if (!user || isEditorUser(user)) return data

  if (data._status === 'published') {
    throw new APIError(
      'Nur die Redaktion darf veröffentlichen. Bitte den Prüfstatus auf „Zur Prüfung eingereicht“ setzen.',
      403,
      null,
      true,
    )
  }

  // Zurückziehen = Update ohne draft=true, das den Status auf Entwurf setzt. Normales Speichern
  // und Autosave laufen immer mit draft=true. (Query-Werte kommen als String oder Boolean an.)
  const isDraftSave = String(req.query?.draft) === 'true' || String(req.query?.autosave) === 'true'
  if (operation === 'update' && originalDoc?.id && data._status === 'draft' && !isDraftSave) {
    // originalDoc ist ggf. ein neuerer Entwurf – maßgeblich ist die Live-Fassung.
    const live = await req.payload.findByID({
      collection: collection.slug,
      id: originalDoc.id,
      draft: false,
      depth: 0,
      overrideAccess: true,
      select: { _status: true },
      req,
    })
    if ((live as { _status?: string } | null)?._status === 'published') {
      throw new APIError('Nur die Redaktion darf Veröffentlichungen zurückziehen.', 403, null, true)
    }
  }

  // Feld-Validierung läuft bei Entwürfen nicht – daher hier statt im Feld.
  if (data.reviewStatus === 'changes_requested' && originalDoc?.reviewStatus !== 'changes_requested') {
    throw new APIError('Nur die Redaktion kann eine Überarbeitung anfordern.', 403, null, true)
  }

  return data
}

/** Merkt sich die einreichende Person und setzt den Status nach dem Veröffentlichen zurück. */
export const trackReviewStatus: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (data._status === 'published') {
    return { ...data, reviewStatus: 'in_progress', reviewNote: null }
  }
  if (data.reviewStatus === 'review' && originalDoc?.reviewStatus !== 'review' && req.user) {
    return { ...data, submittedBy: req.user.id }
  }
  return data
}

/** E-Mail an die Redaktion bei Einreichung bzw. an die einreichende Person bei Rückfrage. */
export const notifyReview: CollectionAfterChangeHook = async ({
  collection,
  doc,
  previousDoc,
  req,
}) => {
  if (doc.reviewStatus === previousDoc?.reviewStatus) return doc

  const { payload } = req
  const adminURL = `${process.env.SERVER_URL || ''}/admin/collections/${collection.slug}/${doc.id}`
  const label = typeof collection.labels?.singular === 'string' ? collection.labels.singular : collection.slug
  const title = (doc.title as string) || `#${doc.id}`

  try {
    if (doc.reviewStatus === 'review') {
      const editors = await payload.find({
        collection: 'users',
        where: { roles: { in: ['redaktion'] } },
        limit: 50,
        depth: 0,
        req,
      })
      const to = editors.docs.map((u) => u.email).filter(Boolean)
      if (to.length) {
        await payload.sendEmail({
          to,
          subject: `Zur Prüfung: ${label} „${title}“`,
          text: `${req.user?.name || 'Jemand'} hat „${title}“ zur Prüfung eingereicht.\n\n${adminURL}`,
        })
      }
    }

    if (doc.reviewStatus === 'changes_requested' && doc.submittedBy) {
      const submitterId = typeof doc.submittedBy === 'object' ? doc.submittedBy.id : doc.submittedBy
      const submitter = await payload.findByID({ collection: 'users', id: submitterId, depth: 0, req })
      if (submitter?.email) {
        await payload.sendEmail({
          to: submitter.email,
          subject: `Überarbeitung erbeten: „${title}“`,
          text: `Die Redaktion bittet um Überarbeitung von „${title}“.\n\nHinweis: ${doc.reviewNote || '–'}\n\n${adminURL}`,
        })
      }
    }
  } catch (err) {
    // Eine fehlgeschlagene Benachrichtigung darf das Speichern nicht verhindern.
    payload.logger.error({ err, msg: 'Workflow-Benachrichtigung fehlgeschlagen' })
  }

  return doc
}

export const workflowHooks = {
  beforeChange: [enforcePublishRights, trackReviewStatus],
  afterChange: [notifyReview],
}
