import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook } from 'payload'

const idOf = (value: unknown): number | string | null =>
  value && typeof value === 'object'
    ? ((value as { id: number | string }).id ?? null)
    : ((value as number | string) ?? null)

/**
 * Pflegt die Gegenprüfung:
 * - Einreichen merkt sich die einreichende Person.
 * - Rückmeldung (geprüft / Überarbeitung) muss von einer *anderen* Person kommen.
 * - Nach dem Veröffentlichen wird die Prüfung zurückgesetzt (Verlauf steht in den Versionen).
 */
export const trackReview: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const { user } = req
  const previous = originalDoc?.reviewStatus
  const next = data.reviewStatus

  if (data._status === 'published') {
    return {
      ...data,
      reviewStatus: 'none',
      reviewer: null,
      reviewNote: null,
      submittedBy: null,
      reviewedBy: null,
    }
  }

  if (!user || next === previous) return data

  if (next === 'review') {
    return { ...data, submittedBy: user.id, reviewedBy: null }
  }

  if (next === 'approved' || next === 'changes_requested') {
    const submitter = idOf(data.submittedBy ?? originalDoc?.submittedBy)
    if (submitter !== null && String(submitter) === String(user.id)) {
      throw new APIError(
        'Die Gegenprüfung muss von einer anderen Person kommen. Du kannst den Inhalt aber jederzeit selbst veröffentlichen.',
        403,
        null,
        true,
      )
    }
    return { ...data, reviewedBy: user.id }
  }

  return data
}

/** E-Mail an die prüfende Person (bzw. Redaktion) bei Einreichung und an die einreichende Person bei Rückmeldung. */
export const notifyReview: CollectionAfterChangeHook = async ({
  collection,
  doc,
  previousDoc,
  req,
}) => {
  if (doc.reviewStatus === previousDoc?.reviewStatus) return doc

  const { payload } = req
  const adminURL = `${process.env.SERVER_URL || ''}/admin/collections/${collection.slug}/${doc.id}`
  const label =
    typeof collection.labels?.singular === 'string' ? collection.labels.singular : collection.slug
  const title = (doc.title as string) || `#${doc.id}`
  const actor = req.user?.name || 'Jemand'

  const emailOf = async (id: number | string | null) =>
    id ? (await payload.findByID({ collection: 'users', id, depth: 0, req })).email : null

  try {
    if (doc.reviewStatus === 'review') {
      let to: string[] = []
      const reviewerId = idOf(doc.reviewer)
      if (reviewerId) {
        const email = await emailOf(reviewerId)
        if (email) to = [email]
      } else {
        const editors = await payload.find({
          collection: 'users',
          where: { roles: { in: ['redaktion'] }, id: { not_equals: req.user?.id } },
          limit: 50,
          depth: 0,
          req,
        })
        to = editors.docs.map((u) => u.email).filter(Boolean)
      }
      if (to.length) {
        await payload.sendEmail({
          to,
          subject: `Bitte gegenlesen: ${label} „${title}“`,
          text: `${actor} bittet dich, „${title}“ gegenzulesen.\n\n${adminURL}`,
        })
      }
    }

    if (doc.reviewStatus === 'approved' || doc.reviewStatus === 'changes_requested') {
      const email = await emailOf(idOf(doc.submittedBy))
      if (email) {
        const verdict =
          doc.reviewStatus === 'approved'
            ? 'geprüft – du kannst ihn veröffentlichen'
            : 'gelesen und bittet um Überarbeitung'
        await payload.sendEmail({
          to: email,
          subject: `Rückmeldung zu „${title}“`,
          text: `${actor} hat „${title}“ ${verdict}.\n\nRückmeldung: ${doc.reviewNote || '–'}\n\n${adminURL}`,
        })
      }
    }
  } catch (err) {
    // Eine fehlgeschlagene Benachrichtigung darf das Speichern nicht verhindern.
    payload.logger.error({ err, msg: 'Benachrichtigung zur Gegenprüfung fehlgeschlagen' })
  }

  return doc
}

export const workflowHooks = {
  beforeChange: [trackReview],
  afterChange: [notifyReview],
}
