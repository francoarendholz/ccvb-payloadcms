import type { ServerProps } from 'payload'

import type { User } from '@ccvb/shared/payload-types'

const COLLECTIONS = [
  { slug: 'pages', label: 'Seite' },
  { slug: 'posts', label: 'Beitrag' },
  { slug: 'events', label: 'Termin' },
] as const

/** Dashboard-Liste „Wartet auf Prüfung“ für Redaktion und Administration. */
export const ReviewQueue = async ({ payload, user }: ServerProps) => {
  const roles = (user as User | undefined)?.roles ?? []
  if (!roles.some((r) => r === 'admin' || r === 'redaktion')) return null

  const results = await Promise.all(
    COLLECTIONS.map(async ({ slug, label }) => {
      const { docs } = await payload.find({
        collection: slug,
        draft: true,
        where: { reviewStatus: { equals: 'review' } },
        depth: 1,
        limit: 20,
        sort: '-updatedAt',
        select: { title: true, updatedAt: true, submittedBy: true },
      })
      return docs.map((doc) => ({ ...doc, slug, label }))
    }),
  )
  const items = results.flat()

  return (
    <section aria-labelledby="review-queue-heading" style={{ marginBottom: '2rem' }}>
      <h2 id="review-queue-heading" style={{ marginBottom: '0.75rem' }}>
        Wartet auf Prüfung ({items.length})
      </h2>
      {items.length === 0 ? (
        <p>Aktuell ist nichts zur Prüfung eingereicht.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
          {items.map((item) => {
            const by =
              item.submittedBy && typeof item.submittedBy === 'object'
                ? (item.submittedBy as User).name
                : null
            return (
              <li key={`${item.slug}-${item.id}`}>
                <a href={`/admin/collections/${item.slug}/${item.id}`}>
                  {item.label}: {item.title}
                </a>
                {by ? ` – eingereicht von ${by}` : ''}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
