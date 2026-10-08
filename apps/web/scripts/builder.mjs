/**
 * Builder und Laufzeit des Web-Containers.
 *
 * - POST /internal/rebuild (Bearer REBUILD_TOKEN): Neubau anfordern. Anfragen werden gebündelt
 *   (Ruhezeit DEBOUNCE_MS, spätestens nach MAX_WAIT_MS), nie laufen zwei Builds parallel.
 * - GET /internal/status: Stand für das CMS-Dashboard.
 * - Jeder Build landet in WWW_DIR/builds/<zeit>; danach zeigt der Symlink WWW_DIR/current
 *   atomar auf die neue Fassung (Caddy liefert current/client aus). Die letzten KEEP_BUILDS
 *   Fassungen bleiben für ein Rollback erhalten.
 * - Nächtlicher Neubau (NIGHTLY_HOUR), damit vergangene Termine aus den Listen fallen.
 * - Alle übrigen Anfragen kommen von Caddy, wenn keine Datei existiert: Weiterleitung laut
 *   current/client/redirects.json oder die 404-Seite.
 * - Startet den Astro-Node-Server (SSR_PORT) für /api/form und /preview aus der aktuellen Fassung.
 *
 * Rollback von Hand (im Container): cd $WWW_DIR && ln -sfn builds/<zeit> current
 */
import { spawn } from 'node:child_process'
import { timingSafeEqual } from 'node:crypto'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WWW = process.env.WWW_DIR || '/data/www'
const BUILDS = path.join(WWW, 'builds')
const CURRENT = path.join(WWW, 'current')
const TOKEN = process.env.REBUILD_TOKEN || ''
const PORT = Number(process.env.BUILDER_PORT || 4321)
const SSR_PORT = Number(process.env.SSR_PORT || 4322)
const DEBOUNCE_MS = Number(process.env.DEBOUNCE_MS || 15_000)
const MAX_WAIT_MS = Number(process.env.MAX_WAIT_MS || 120_000)
const KEEP_BUILDS = Number(process.env.KEEP_BUILDS || 3)
const NIGHTLY_HOUR = Number(process.env.NIGHTLY_HOUR || 3)
const RETRY_MS = 60_000

const log = (...args) => console.log(new Date().toISOString(), ...args)

// ---------- Build-Steuerung ----------
const status = { state: 'idle', lastSuccess: null, lastError: null, lastDurationMs: null, reasons: [] }
let timer = null
let firstRequestAt = null
let building = false
let again = false

function requestBuild(reason, { immediate = false } = {}) {
  status.reasons.push(reason)
  log(`Neubau angefordert: ${reason}`)
  if (building) {
    again = true
    return
  }
  status.state = 'pending'
  firstRequestAt ??= Date.now()
  clearTimeout(timer)
  const wait = immediate ? 0 : Math.min(DEBOUNCE_MS, Math.max(0, firstRequestAt + MAX_WAIT_MS - Date.now()))
  timer = setTimeout(build, wait)
}

const run = (cmd, args, env = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: WEB_DIR, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    const collect = (chunk) => {
      output = (output + chunk).slice(-20_000)
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve(output) : reject(new Error(`${path.basename(cmd)} beendet mit Code ${code}\n${output.slice(-4000)}`)),
    )
  })

/**
 * Die Fassungen liegen außerhalb des Projekts. Ihr Server-Code importiert Pakete (z. B. sharp)
 * per Namen – über diesen Symlink findet Node sie im Projekt.
 */
async function linkNodeModules() {
  const link = path.join(WWW, 'node_modules')
  await fs.mkdir(WWW, { recursive: true })
  await fs.rm(link, { force: true })
  await fs.symlink(path.join(WEB_DIR, 'node_modules'), link)
}

async function build() {
  building = true
  firstRequestAt = null
  status.state = 'building'
  const reasons = status.reasons.splice(0)
  const id = new Date().toISOString().replace(/[:.]/g, '-')
  const out = path.join(BUILDS, id)
  const started = Date.now()
  log(`Build ${id} startet (${reasons.length} Anfrage(n))`)
  try {
    await fs.mkdir(BUILDS, { recursive: true })
    await run(path.join(WEB_DIR, 'node_modules/.bin/astro'), ['build'], { ASTRO_OUT_DIR: out })
    await run(path.join(WEB_DIR, 'node_modules/.bin/pagefind'), ['--site', path.join(out, 'client')])
    await activate(id)
    status.lastSuccess = new Date().toISOString()
    status.lastDurationMs = Date.now() - started
    log(`Build ${id} fertig in ${Math.round(status.lastDurationMs / 1000)} s`)
    await prune()
    await restartSsr()
  } catch (err) {
    status.lastError = { at: new Date().toISOString(), message: String(err.message || err).slice(0, 4000) }
    log(`Build ${id} fehlgeschlagen:\n${status.lastError.message}`)
    await fs.rm(out, { recursive: true, force: true })
    // Ohne jede Fassung (erster Start, CMS noch nicht bereit) später erneut versuchen.
    if (!existsSync(CURRENT)) setTimeout(() => requestBuild('erneuter Versuch', { immediate: true }), RETRY_MS)
  } finally {
    building = false
    status.state = 'idle'
    if (again) {
      again = false
      requestBuild('während des Builds angefordert')
    }
  }
}

/** Symlink atomar umsetzen (relativ, damit er auch in Caddys Mount auflöst). */
async function activate(id) {
  const tmp = `${CURRENT}.tmp`
  await fs.rm(tmp, { force: true })
  await fs.symlink(path.join('builds', id), tmp)
  await fs.rename(tmp, CURRENT)
  redirectsCache = null
}

async function prune() {
  const active = path.basename(await fs.readlink(CURRENT))
  const all = (await fs.readdir(BUILDS)).sort().reverse()
  for (const name of all.slice(KEEP_BUILDS)) {
    if (name !== active) await fs.rm(path.join(BUILDS, name), { recursive: true, force: true })
  }
}

function scheduleNightly() {
  const next = new Date()
  next.setHours(NIGHTLY_HOUR, 0, 0, 0)
  if (next <= new Date()) next.setDate(next.getDate() + 1)
  setTimeout(() => {
    requestBuild('nächtlicher Neubau', { immediate: true })
    scheduleNightly()
  }, next - Date.now())
}

// ---------- SSR-Server (Astro, /api/form und /preview) ----------
let ssr = null
let stopping = false

function startSsr() {
  const entry = path.join(CURRENT, 'server/entry.mjs')
  if (!existsSync(entry)) return
  // Node löst den Symlink auf: Der Server hängt an „seiner“ Fassung, auch wenn current umspringt.
  const child = spawn(process.execPath, [entry], {
    env: { ...process.env, HOST: '0.0.0.0', PORT: String(SSR_PORT) },
    stdio: 'inherit',
  })
  ssr = child
  child.on('exit', (code) => {
    if (ssr === child) ssr = null
    if (!stopping) {
      log(`SSR-Server beendet (Code ${code}), Neustart in 2 s`)
      setTimeout(() => !ssr && startSsr(), 2000)
    }
  })
}

async function restartSsr() {
  if (ssr) {
    stopping = true
    const old = ssr
    await new Promise((resolve) => {
      old.once('exit', resolve)
      old.kill('SIGTERM')
      setTimeout(() => old.kill('SIGKILL'), 5000)
    })
    stopping = false
  }
  startSsr()
}

// ---------- HTTP ----------
let redirectsCache = null

async function redirects() {
  if (!redirectsCache) {
    try {
      redirectsCache = JSON.parse(await fs.readFile(path.join(CURRENT, 'client/redirects.json'), 'utf8'))
    } catch {
      redirectsCache = {}
    }
  }
  return redirectsCache
}

const tokenOk = (header) => {
  const given = Buffer.from(String(header || '').replace(/^Bearer /, ''))
  const expected = Buffer.from(TOKEN)
  return TOKEN.length > 0 && given.length === expected.length && timingSafeEqual(given, expected)
}

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')

  if (url.pathname === '/internal/rebuild' && req.method === 'POST') {
    if (!tokenOk(req.headers.authorization)) return json(res, 401, { error: 'unauthorized' })
    let body = ''
    for await (const chunk of req) body = (body + chunk).slice(0, 2000)
    let reason = 'CMS'
    try {
      reason = JSON.parse(body).reason || reason
    } catch {}
    requestBuild(reason)
    return json(res, 202, { state: status.state })
  }
  if (url.pathname === '/internal/status') {
    const { reasons, ...rest } = status
    return json(res, 200, { ...rest, pending: reasons.length })
  }

  // Fallback für Caddy: Weiterleitung oder 404-Seite
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    return res.end()
  }
  let pathname = url.pathname
  try {
    pathname = decodeURIComponent(pathname)
  } catch {}
  const key = pathname.replace(/\/+$/, '') || '/'
  const target = (await redirects())[key]
  if (target) {
    res.writeHead(target.status, { Location: target.to, 'Cache-Control': 'max-age=300' })
    return res.end()
  }
  try {
    const page = await fs.readFile(path.join(CURRENT, 'client/404.html'))
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(req.method === 'HEAD' ? undefined : page)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Nicht gefunden')
  }
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    stopping = true
    ssr?.kill('SIGTERM')
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000)
  })
}

if (!TOKEN) log('WARNUNG: REBUILD_TOKEN fehlt – Rebuild-Anfragen werden abgelehnt.')
await linkNodeModules()
server.listen(PORT, () => log(`Builder hört auf Port ${PORT}, SSR auf ${SSR_PORT}, Ausgabe in ${WWW}`))
startSsr()
requestBuild('Containerstart', { immediate: true })
scheduleNightly()
