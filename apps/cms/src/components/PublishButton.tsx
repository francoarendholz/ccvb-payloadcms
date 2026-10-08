'use client'

import { PublishButton as DefaultPublishButton, useAuth } from '@payloadcms/ui'

import type { User } from '@ccvb/shared/payload-types'

/**
 * Veröffentlichen-Button nur für Redaktion/Administration. Autor*innen sehen stattdessen
 * einen Hinweis – die eigentliche Sperre erzwingt der Server (workflow/hooks.ts).
 */
export const PublishButton: React.FC<{ label?: string }> = (props) => {
  const { user } = useAuth<User>()
  const canPublish = user?.roles?.some((role) => role === 'admin' || role === 'redaktion')

  if (canPublish) return <DefaultPublishButton {...props} />

  return (
    <p style={{ margin: 0, maxWidth: '18rem', fontSize: '0.8125rem', lineHeight: 1.4 }}>
      Fertig? Rechts den Prüfstatus auf <strong>„Zur Prüfung eingereicht“</strong> setzen – die
      Redaktion wird benachrichtigt und veröffentlicht. Änderungen werden automatisch gespeichert.
    </p>
  )
}
