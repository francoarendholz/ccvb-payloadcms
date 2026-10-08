import type { ServerProps, Where } from 'payload'

import type { User } from '@ccvb/shared/payload-types'

const COLLECTIONS = [
  { slug: 'pages', label: 'Seite' },
  { slug: 'posts', label: 'Beitrag' },
  { slug: 'events', label: 'Termin' },
] as const

type Item = { id: number; title?: string | null; slug: string; label: string; meta: string }

const nameOf = (u: unknown) => (u && typeof u === 'object' ? (u as User).name : null)

async function findAll(
  payload: ServerProps['payload'],
  where: Where,
  meta: (doc: Record<string, unknown>) => string,
) {
  const results = await Promise.all(
    COLLECTIONS.map(async ({ slug, label }) => {
      const { docs } = await payload.find({
        collection: slug,
        draft: true,
        where,
        depth: 1,
        limit: 20,
        sort: '-updatedAt',
        select: { title: true, submittedBy: true, reviewedBy: true, reviewStatus: true },
      })
      return docs.map((doc) => ({ id: doc.id, title: doc.title, slug, label, meta: meta(doc) }))
    }),
  )
  return results.flat()
}

function List({
  id,
  heading,
  items,
  empty,
}: {
  id: string
  heading: string
  items: Item[]
  empty: string
}) {
  return (
    <section aria-labelledby={id} style={{ marginBottom: '1.5rem' }}>
      <h2 id={id} style={{ marginBottom: '0.5rem' }}>
        {heading} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p>{empty}</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
          {items.map((item) => (
            <li key={`${item.slug}-${item.id}`}>
              <a href={`/admin/collections/${item.slug}/${item.id}`}>
                {item.label}: {item.title}
              </a>
              {item.meta}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Dashboard: offene Gegenprüfungen für mich und Rückmeldungen zu meinen Einreichungen. */
export const ReviewQueue = async ({ payload, user }: ServerProps) => {
  const me = user as User | undefined
  if (!me) return null
  const isEditor = me.roles?.some((r) => r === 'admin' || r === 'redaktion')

  const assigned: Where = isEditor
    ? { or: [{ reviewer: { equals: me.id } }, { reviewer: { exists: false } }] }
    : { reviewer: { equals: me.id } }

  const [toReview, feedback] = await Promise.all([
    findAll(
      payload,
      {
        and: [
          { reviewStatus: { equals: 'review' } },
          { submittedBy: { not_equals: me.id } },
          assigned,
        ],
      },
      (d) => (nameOf(d.submittedBy) ? ` – von ${nameOf(d.submittedBy)}` : ''),
    ),
    findAll(
      payload,
      {
        and: [
          { submittedBy: { equals: me.id } },
          { reviewStatus: { in: ['approved', 'changes_requested'] } },
        ],
      },
      (d) =>
        `${d.reviewStatus === 'approved' ? ' – geprüft' : ' – Überarbeitung erbeten'}${
          nameOf(d.reviewedBy) ? ` von ${nameOf(d.reviewedBy)}` : ''
        }`,
    ),
  ])

  if (!toReview.length && !feedback.length) return null

  return (
    <div style={{ marginBottom: '1rem' }}>
      {toReview.length > 0 && (
        <List id="review-todo" heading="Wartet auf deine Prüfung" items={toReview} empty="" />
      )}
      {feedback.length > 0 && (
        <List
          id="review-feedback"
          heading="Rückmeldungen zu deinen Einreichungen"
          items={feedback}
          empty=""
        />
      )}
    </div>
  )
}
