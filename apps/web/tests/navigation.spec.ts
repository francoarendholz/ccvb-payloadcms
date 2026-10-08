import { expect, test } from '@playwright/test'

test('Skip-Link springt zum Inhalt', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Zum Inhalt springen' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#inhalt$/)
})

test('Sprachumschalter verlinkt nur vorhandene Fassungen', async ({ page }) => {
  await page.goto('/jugend/') // nur Deutsch
  await expect(page.getByRole('navigation', { name: 'Sprache wählen' })).toHaveCount(0)

  await page.goto('/verband/')
  const switcher = page.getByRole('navigation', { name: 'Sprache wählen' })
  await expect(switcher.getByRole('link', { name: 'Leichte Sprache' })).toHaveAttribute('href', '/leichte-sprache/verband/')
  await expect(switcher.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en/verband/')
})

test('Leichte Sprache: lang="de" und eigenes Layout', async ({ page }) => {
  await page.goto('/leichte-sprache/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.locator('html')).toHaveClass(/\bls\b/)
})

test('Links auf fehlende Sprachfassungen zeigen auf Deutsch', async ({ page }) => {
  await page.goto('/leichte-sprache/')
  await expect(page.locator('footer').getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum/')
})

test.describe('Mega-Menü (Disclosure)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('öffnet per Tastatur und schließt mit Escape', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Untermenü Verband' })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const sub = page.locator(`#${await toggle.getAttribute('aria-controls')}`)
    await expect(sub.getByRole('link', { name: 'Vorstand' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
    await expect(sub).toBeHidden()
  })
})

test.describe('ohne JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('Untermenüs sind als normale Links erreichbar', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' })
    await expect(nav.getByRole('link', { name: 'Vorstand' })).toBeVisible()
    await expect(nav.getByRole('button')).toHaveCount(0)
  })
})

test('Reflow: keine horizontale Scrollleiste bei 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  for (const path of ['/', '/termine/landesmeisterschaft-2027/', '/downloads/', '/verband/kontakt/']) {
    await page.goto(path)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})

test('Downloads lassen sich filtern', async ({ page }) => {
  await page.goto('/downloads/')
  await page.getByLabel('Kategorie').selectOption({ label: 'Formulare' })
  await expect(page.getByRole('status')).toHaveText('2 Dokumente')
  await expect(page.getByRole('link', { name: /Satzung herunterladen|^Satzung/ })).toBeHidden()
  await expect(page).toHaveURL(/kategorie=formulare/)
})

test('Kontaktformular: Absenden führt zur Danke-Seite', async ({ page }) => {
  await page.goto('/verband/kontakt/')
  await page.getByLabel('Name').fill('Testperson')
  await page.getByLabel('E-Mail-Adresse').fill('test@example.org')
  await page.getByLabel('Thema').selectOption('allgemein')
  await page.getByLabel('Nachricht').fill('Automatischer Test')
  await page.getByLabel(/Verarbeitung meiner Angaben/).check()
  await page.getByRole('button', { name: 'Nachricht senden' }).click()
  await expect(page).toHaveURL(/\/danke\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vielen Dank!')
})

test('Formular-Endpunkt lehnt fehlende Pflichtfelder ab', async ({ request, baseURL }) => {
  const form = await request.get('/verband/kontakt/').then((r) => r.text())
  const formId = form.match(/name="_form" value="(\d+)"/)![1]
  const res = await request.post('/api/form', {
    form: { _form: formId, _locale: 'de', _page: '/verband/kontakt/', email: 'kaputt' },
    headers: { Origin: new URL(baseURL!).origin },
    maxRedirects: 0,
  })
  expect(res.status()).toBe(400)
  expect(await res.text()).toContain('ungültige E-Mail-Adresse')
})
