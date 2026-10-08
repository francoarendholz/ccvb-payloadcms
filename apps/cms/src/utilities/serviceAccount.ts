import { randomBytes } from 'crypto'
import type { Payload } from 'payload'

export const PREVIEW_ACCOUNT_EMAIL = 'vorschau@dienstkonto.invalid'

/**
 * Legt beim Start das Dienstkonto für die Entwurfsvorschau der Website an bzw. setzt dessen
 * API-Key auf `PREVIEW_API_KEY` (gleicher Wert wie `CMS_API_KEY` im Web-Container).
 * Rolle „vorschau“: darf nur lesen, kann sich nicht im Admin anmelden. API-Keys umgehen TOTP.
 */
export async function ensurePreviewAccount(payload: Payload) {
  const apiKey = process.env.PREVIEW_API_KEY
  if (!apiKey) return

  const data = {
    name: 'Website-Vorschau (Dienstkonto)',
    roles: ['vorschau' as const],
    enableAPIKey: true,
    apiKey,
  }
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: PREVIEW_ACCOUNT_EMAIL } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) {
    await payload.update({ collection: 'users', id: docs[0].id, data })
  } else {
    await payload.create({
      collection: 'users',
      data: { ...data, email: PREVIEW_ACCOUNT_EMAIL, password: randomBytes(32).toString('base64url') },
    })
    payload.logger.info('Dienstkonto für die Website-Vorschau angelegt.')
  }
}
