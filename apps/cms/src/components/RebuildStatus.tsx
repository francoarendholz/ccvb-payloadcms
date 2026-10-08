type Status = {
  state: 'idle' | 'pending' | 'building'
  lastSuccess: string | null
  lastError: { at: string; message: string } | null
}

const time = (iso: string) =>
  new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(new Date(iso))

/** Dashboard: Stand der öffentlichen Website (Builder im Web-Container). */
export const RebuildStatus = async () => {
  const url = process.env.REBUILD_URL
  if (!url) return null

  let status: Status | null = null
  try {
    const res = await fetch(url.replace(/\/rebuild$/, '/status'), {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) status = (await res.json()) as Status
  } catch {
    // Builder nicht erreichbar – unten als Hinweis
  }

  const failed =
    status?.lastError && (!status.lastSuccess || status.lastError.at > status.lastSuccess)
  let text: string
  if (!status) text = 'Der Stand der Website kann gerade nicht abgefragt werden.'
  else if (status.state !== 'idle')
    text = 'Die Website wird gerade aktualisiert. Änderungen sind in etwa einer Minute online.'
  else if (failed)
    text = `Die letzte Aktualisierung der Website ist fehlgeschlagen (${time(status.lastError!.at)}). Die Website zeigt weiterhin den vorherigen Stand.`
  else if (status.lastSuccess) text = `Website zuletzt aktualisiert: ${time(status.lastSuccess)}.`
  else text = 'Die Website wurde noch nicht erstellt.'

  return (
    <section
      aria-labelledby="website-status"
      style={{
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderLeft: `4px solid ${failed || !status ? 'var(--theme-error-500)' : 'var(--theme-success-500)'}`,
        background: 'var(--theme-elevation-50)',
      }}
    >
      <h2 id="website-status" style={{ margin: 0, fontSize: '1rem' }}>
        Öffentliche Website
      </h2>
      <p style={{ margin: '0.25rem 0 0' }} role="status">
        {text}
      </p>
    </section>
  )
}
