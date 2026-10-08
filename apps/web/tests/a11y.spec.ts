import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/** Ein Vertreter je Seitentyp und Sprache. */
const PAGES = [
  ['Startseite', '/'],
  ['Bereichsseite mit Bild', '/wettkaempfe/'],
  ['Unterseite', '/verband/vorstand/'],
  ['Formular', '/verband/kontakt/'],
  ['Bild + Text', '/jugend/'],
  ['Aktuelles', '/aktuelles/'],
  ['Beitrag', '/aktuelles/einladung-landesverbandstag-2026/'],
  ['Termine', '/termine/'],
  ['Termin', '/termine/landesmeisterschaft-2027/'],
  ['Downloads', '/downloads/'],
  ['Suche', '/suche/'],
  ['Barrierefreiheit', '/barrierefreiheit/'],
  ['Danke', '/danke/'],
  ['404', '/gibt-es-nicht/'],
  ['Leichte Sprache', '/leichte-sprache/'],
  ['Leichte Sprache Verband', '/leichte-sprache/verband/'],
  ['Englisch', '/en/'],
  ['Englisch Termine', '/en/events/'],
] as const

for (const [name, path] of PAGES) {
  test(`${name} (${path}) hat keine axe-Verstöße (WCAG 2.2 AA)`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze()
    const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)
    expect(summary).toEqual([])
  })

  test(`${name} (${path}) hat genau eine H1 und Landmarks`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main#inhalt')).toHaveCount(1)
    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.locator('footer').first()).toBeVisible()
  })
}
