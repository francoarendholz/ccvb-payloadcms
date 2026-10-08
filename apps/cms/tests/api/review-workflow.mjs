// End-to-end-Test der optionalen Gegenprüfung über die REST-API.
// Aufruf (Dev-Server läuft, TOTP_DISABLED=true): node apps/cms/tests/api/review-workflow.mjs
const BASE = process.env.BASE || 'http://localhost:3000'
const PW = 'Test-Passwort-123!'
let failures = 0

const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${extra ? ' — ' + extra : ''}`)
  if (!cond) failures++
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `JWT ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try {
    json = await res.json()
  } catch {}
  return { status: res.status, json }
}

const login = async (email) =>
  (await api('/api/users/login', { method: 'POST', body: { email, password: PW } })).json?.token
const idOf = (v) => (v && typeof v === 'object' ? v.id : v)

const content = (text) => ({
  root: {
    type: 'root', version: 1, direction: null, format: '', indent: 0,
    children: [{
      type: 'paragraph', version: 1, direction: null, format: '', indent: 0, textFormat: 0,
      children: [{ type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }],
    }],
  },
})

// --- Setup
const init = await api('/api/users/init')
if (!init.json?.initialized) {
  await api('/api/users/first-register', {
    method: 'POST',
    body: { email: 'admin@test.local', password: PW, name: 'Test Admin', roles: ['admin'] },
  })
}
const adminToken = await login('admin@test.local')
for (const [email, name, role] of [
  ['redaktion@test.local', 'Rita Redaktion', 'redaktion'],
  ['autor@test.local', 'Anton Autor', 'autor'],
  ['autorin@test.local', 'Berta Autorin', 'autor'],
]) {
  const exists = await api(`/api/users?where[email][equals]=${email}`, { token: adminToken })
  if (!exists.json?.docs?.length) {
    await api('/api/users', { method: 'POST', token: adminToken, body: { email, name, password: PW, roles: [role] } })
  }
}
const editorToken = await login('redaktion@test.local')
const authorToken = await login('autor@test.local')
const author2Token = await login('autorin@test.local')
check('Logins', Boolean(adminToken && editorToken && authorToken && author2Token))

const me = (await api('/api/users/me', { token: authorToken })).json.user
const author2 = (await api('/api/users/me', { token: author2Token })).json.user

await api(`/api/users/${me.id}`, { method: 'PATCH', token: authorToken, body: { roles: ['admin'] } })
const meAfter = (await api('/api/users/me', { token: authorToken })).json.user
check('Autor*in kann eigene Rolle nicht ändern', meAfter.roles.join() === 'autor')

const colleagues = await api('/api/users?limit=50', { token: authorToken })
check('Autor*in sieht Kolleg*innen (Auswahl Prüfer*in)', colleagues.json?.totalDocs >= 4, `${colleagues.json?.totalDocs}`)
const otherUpdate = await api(`/api/users/${author2.id}`, { method: 'PATCH', token: authorToken, body: { name: 'gehackt' } })
check('Autor*in kann fremdes Profil NICHT ändern', otherUpdate.status === 403, `HTTP ${otherUpdate.status}`)

// --- 1) Ohne Gegenprüfung direkt veröffentlichen
const s1 = `direkt-${Date.now()}`
const direct = await api('/api/posts', {
  method: 'POST', token: authorToken,
  body: { title: 'Direkt veröffentlicht', slug: s1, content: content('Ohne Prüfung'), _status: 'published' },
})
check('Autor*in veröffentlicht direkt ohne Prüfung', direct.status === 201, `HTTP ${direct.status}`)
check('…und der Beitrag ist öffentlich', (await api(`/api/posts?where[slug][equals]=${s1}`)).json?.totalDocs === 1)
const unpub = await api(`/api/posts/${direct.json?.doc?.id}`, { method: 'PATCH', token: authorToken, body: { _status: 'draft' } })
check('Autor*in kann Veröffentlichung zurückziehen', unpub.status === 200, `HTTP ${unpub.status}`)

// --- 2) Mit Gegenprüfung durch bestimmte Person
const s2 = `review-${Date.now()}`
const created = await api('/api/posts?draft=true', {
  method: 'POST', token: authorToken,
  body: { title: 'Bitte gegenlesen', slug: s2, content: content('Entwurf'), _status: 'draft' },
})
const postId = created.json?.doc?.id
check('Entwurf angelegt', created.status === 201)

const submit = await api(`/api/posts/${postId}?draft=true`, {
  method: 'PATCH', token: authorToken, body: { reviewStatus: 'review', reviewer: author2.id },
})
check('Einreichen mit Prüfer*in, „Eingereicht von“ gesetzt',
  submit.status === 200 && idOf(submit.json?.doc?.submittedBy) === me.id, `HTTP ${submit.status}`)

const selfApprove = await api(`/api/posts/${postId}?draft=true`, {
  method: 'PATCH', token: authorToken, body: { reviewStatus: 'approved' },
})
check('Selbst-Freigabe der Prüfung wird abgelehnt', selfApprove.status === 403,
  `HTTP ${selfApprove.status}: ${selfApprove.json?.errors?.[0]?.message}`)

const changes = await api(`/api/posts/${postId}?draft=true`, {
  method: 'PATCH', token: author2Token, body: { reviewStatus: 'changes_requested', reviewNote: 'Bitte Datum ergänzen.' },
})
check('Andere Autorin bittet um Überarbeitung, „Geprüft von“ gesetzt',
  changes.status === 200 && idOf(changes.json?.doc?.reviewedBy) === author2.id, `HTTP ${changes.status}`)

const resubmit = await api(`/api/posts/${postId}?draft=true`, {
  method: 'PATCH', token: authorToken, body: { reviewStatus: 'review', excerpt: 'Am 12. Mai' },
})
check('Erneut eingereicht, „Geprüft von“ zurückgesetzt', resubmit.status === 200 && !resubmit.json?.doc?.reviewedBy)

const approve = await api(`/api/posts/${postId}?draft=true`, {
  method: 'PATCH', token: author2Token, body: { reviewStatus: 'approved', reviewNote: 'Passt!' },
})
check('Andere Autorin gibt frei', approve.status === 200 && approve.json?.doc?.reviewStatus === 'approved')

check('Entwurf ist anonym NICHT sichtbar', (await api(`/api/posts?where[slug][equals]=${s2}`)).json?.totalDocs === 0)

const publish = await api(`/api/posts/${postId}`, { method: 'PATCH', token: authorToken, body: { _status: 'published' } })
const pd = publish.json?.doc
check('Autor*in veröffentlicht nach Freigabe, Prüfung zurückgesetzt',
  publish.status === 200 && pd?.reviewStatus === 'none' && !pd?.reviewer && !pd?.submittedBy && !pd?.reviewNote,
  `HTTP ${publish.status}, ${pd?.reviewStatus}`)
check('Veröffentlichter Beitrag ist öffentlich', (await api(`/api/posts?where[slug][equals]=${s2}`)).json?.totalDocs === 1)

// --- Rollen-Unterschiede
check('Autor*in kann NICHT löschen', (await api(`/api/posts/${postId}`, { method: 'DELETE', token: authorToken })).status === 403)
check('Autor*in kann Navigation NICHT ändern',
  (await api('/api/globals/header', { method: 'POST', token: authorToken, body: { mainNav: [] } })).status === 403)

// --- Öffentliche Endpunkte
check('Navigation anonym lesbar', (await api('/api/globals/header')).status === 200)
check('Bilder anonym lesbar', (await api('/api/media')).status === 200)
check('Benutzer anonym NICHT lesbar', (await api('/api/users')).status === 403)
check('Formular-Eingänge anonym NICHT lesbar', (await api('/api/form-submissions')).status === 403)

// Aufräumen
for (const id of [postId, direct.json?.doc?.id]) await api(`/api/posts/${id}`, { method: 'DELETE', token: editorToken })

console.log(failures ? `\n${failures} Test(s) fehlgeschlagen` : '\nAlle Tests bestanden')
process.exit(failures ? 1 : 0)
