/**
 * Beispielinhalte für die lokale Entwicklung und das Lab (Deutsch, Leichte Sprache, Englisch).
 * Aufruf (in apps/cms): pnpm seed  – bricht ab, wenn es schon eine Startseite gibt.
 * Mit --force werden vorhandene Beispielinhalte vorher gelöscht.
 */
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../src/payload.config'

type Locale = 'de' | 'ls' | 'en'
type Lexical = { root: Record<string, unknown> }

// ---------- Rich-Text-Helfer ----------
const text = (t: string, format = 0) => ({ type: 'text', text: t, format, version: 1, detail: 0, mode: 'normal', style: '' })
const el = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
  type,
  children,
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  ...extra,
})
const p = (t: string) => el('paragraph', [text(t)], { textFormat: 0, textStyle: '' })
const h = (tag: 'h2' | 'h3' | 'h4', t: string) => el('heading', [text(t)], { tag })
const ul = (items: string[]) =>
  el(
    'list',
    items.map((t, i) => el('listitem', [text(t)], { value: i + 1 })),
    { listType: 'bullet', tag: 'ul', start: 1 },
  )
const linkP = (before: string, label: string, url: string) =>
  el('paragraph', [
    text(before),
    el('link', [text(label)], { fields: { linkType: 'custom', url, newTab: false }, id: crypto.randomUUID().slice(0, 24) }),
  ])
const rt = (...nodes: unknown[]): Lexical => ({ root: el('root', nodes) })

// ---------- Platzhalter-Dateien ----------
async function placeholderImage(label: string, color: string, width = 1600, height = 1000) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="${color}"/>
    <circle cx="${width * 0.8}" cy="${height * 0.25}" r="${height * 0.35}" fill="#ffffff" opacity="0.12"/>
    <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${Math.round(width / 14)}" font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text>
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer()
}

/** Minimale, gültige PDF-Datei. */
function placeholderPdf(title: string) {
  const content = `BT /F1 24 Tf 72 720 Td (${title}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((obj, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf)
}

// ---------- Seed ----------
async function seed(payload: Payload) {
  const published = { _status: 'published' as const }

  const media = async (alt: Record<Locale, string>, label: string, color: string, credit?: string) => {
    const doc = await payload.create({
      collection: 'media',
      locale: 'de',
      data: { alt: alt.de, credit },
      file: { data: await placeholderImage(label, color), mimetype: 'image/jpeg', name: `${label.toLowerCase().replace(/\W+/g, '-')}.jpg`, size: 0 },
    })
    for (const l of ['ls', 'en'] as const) {
      await payload.update({ collection: 'media', id: doc.id, locale: l, data: { alt: alt[l] } })
    }
    return doc.id
  }

  payload.logger.info('Bilder …')
  const imgHero = await media(
    { de: 'Cheerleading-Team bei einer Hebefigur in der Halle', ls: 'Ein Cheerleading-Team in einer Sport-Halle', en: 'Cheerleading team performing a stunt in a gym' },
    'CCVB',
    '#bd131e',
    'CCVB',
  )
  const imgTeam = await media({ de: 'Gruppenfoto mit Pompons', ls: 'Viele Menschen mit Pompons', en: 'Group photo with pom-poms' }, 'Team', '#1e1e1c')
  const imgCamp = await media({ de: 'Kinder beim Trainingscamp', ls: 'Kinder beim Training', en: 'Children at a training camp' }, 'Camp', '#8f0e17')
  const imgMeisterschaft = await media({ de: 'Siegerehrung der Landesmeisterschaft', ls: 'Sieger-Ehrung bei der Meisterschaft', en: 'Award ceremony at the state championship' }, 'Meisterschaft', '#555552')
  const logoLsb = await media({ de: 'Landessportbund Berlin', ls: 'Landes-Sport-Bund Berlin', en: 'Berlin State Sports Association' }, 'LSB', '#0b5394')
  const logoCcvd = await media({ de: 'Cheerleading und Cheerperformance Verband Deutschland', ls: 'Cheerleading Verband Deutschland', en: 'German Cheerleading Association' }, 'CCVD', '#1e1e1c')

  payload.logger.info('Kategorien, Personen, Dokumente …')
  const cat = async (title: Record<Locale, string>, slug: string, type: 'posts' | 'documents') => {
    const doc = await payload.create({ collection: 'categories', locale: 'de', data: { title: title.de, slug, type } })
    for (const l of ['ls', 'en'] as const) await payload.update({ collection: 'categories', id: doc.id, locale: l, data: { title: title[l] } })
    return doc.id
  }
  const catVerband = await cat({ de: 'Verband', ls: 'Verband', en: 'Association' }, 'verband', 'posts')
  const catWettkampf = await cat({ de: 'Wettkampf', ls: 'Wett-Kampf', en: 'Competition' }, 'wettkampf', 'posts')
  const catOrdnungen = await cat({ de: 'Satzung und Ordnungen', ls: 'Regeln vom Verband', en: 'Statutes and regulations' }, 'ordnungen', 'documents')
  const catFormulare = await cat({ de: 'Formulare', ls: 'Formulare', en: 'Forms' }, 'formulare', 'documents')
  const catProtokolle = await cat({ de: 'Protokolle', ls: 'Protokolle', en: 'Minutes' }, 'protokolle', 'documents')

  const person = async (name: string, role: Record<Locale, string>, email: string, area: string, sort: number) => {
    const doc = await payload.create({ collection: 'people', locale: 'de', data: { name, role: role.de, email, area: area as never, sort } })
    for (const l of ['ls', 'en'] as const) await payload.update({ collection: 'people', id: doc.id, locale: l, data: { role: role[l] } })
    return doc.id
  }
  const p1 = await person('Alex Beispiel', { de: 'Präsidentin', ls: 'Chefin vom Verband', en: 'President' }, 'praesidium@example.org', 'verband', 1)
  const p2 = await person('Sam Muster', { de: 'Vizepräsident Sport', ls: 'Zuständig für Sport', en: 'Vice President Sports' }, 'sport@example.org', 'wettkaempfe', 2)
  const p3 = await person('Kim Probe', { de: 'Jugendwartin', ls: 'Zuständig für Kinder und Jugendliche', en: 'Youth Officer' }, 'jugend@example.org', 'jugend', 3)

  const document = async (title: Record<Locale, string>, category: number, area: string, validFrom: string) => {
    const doc = await payload.create({
      collection: 'documents',
      locale: 'de',
      data: { title: title.de, category, area: area as never, validFrom },
      file: { data: placeholderPdf(title.de.normalize('NFD').replace(/[^\x20-\x7e]/g, '')), mimetype: 'application/pdf', name: `${title.de.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}.pdf`, size: 0 },
    })
    for (const l of ['ls', 'en'] as const) await payload.update({ collection: 'documents', id: doc.id, locale: l, data: { title: title[l] } })
    return doc.id
  }
  await document({ de: 'Satzung', ls: 'Satzung (Regeln vom Verband)', en: 'Statutes' }, catOrdnungen, 'verband', '2025-03-15')
  await document({ de: 'Beitragsordnung', ls: 'Regeln für den Beitrag', en: 'Membership fee regulations' }, catOrdnungen, 'verband', '2025-03-15')
  const docAufnahme = await document({ de: 'Aufnahmeantrag', ls: 'Antrag zum Mitmachen', en: 'Membership application' }, catFormulare, 'verband', '2024-01-01')
  const docProtokoll = await document({ de: 'Protokoll Landesverbandstag 2025', ls: 'Protokoll Landesverbandstag 2025', en: 'Minutes general assembly 2025' }, catProtokolle, 'verband', '2025-11-20')
  const docRegelwerk = await document({ de: 'Wettkampfregelwerk 2026', ls: 'Regeln für Wett-Kämpfe 2026', en: 'Competition rules 2026' }, catOrdnungen, 'wettkaempfe', '2026-01-01')
  const docAusschreibung = await document({ de: 'Ausschreibung Landesmeisterschaft 2027', ls: 'Einladung Landes-Meisterschaft 2027', en: 'Invitation state championship 2027' }, catFormulare, 'wettkaempfe', '2026-09-01')

  payload.logger.info('Formular …')
  const form = await payload.create({
    collection: 'forms',
    data: {
      title: 'Kontakt',
      submitButtonLabel: 'Nachricht senden',
      confirmationType: 'message',
      confirmationMessage: rt(p('Vielen Dank für Ihre Nachricht!')) as never,
      fields: [
        { blockType: 'text', name: 'name', label: 'Name', required: true },
        { blockType: 'email', name: 'email', label: 'E-Mail-Adresse', required: true },
        {
          blockType: 'select',
          name: 'thema',
          label: 'Thema',
          options: [
            { label: 'Allgemeine Frage', value: 'allgemein' },
            { label: 'Wettkämpfe', value: 'wettkaempfe' },
            { label: 'Mitgliedschaft', value: 'mitgliedschaft' },
          ],
        },
        { blockType: 'textarea', name: 'nachricht', label: 'Nachricht', required: true },
        { blockType: 'checkbox', name: 'datenschutz', label: 'Ich bin mit der Verarbeitung meiner Angaben zur Beantwortung einverstanden.', required: true },
      ],
    } as never,
  })

  // ---------- Seiten ----------
  payload.logger.info('Seiten …')
  type PageData = { title: string; intro?: string; heroImage?: number; layout?: unknown[] }
  const page = async (slug: string, area: string | null, versions: Partial<Record<Locale, PageData>>, parent?: number) => {
    let id: number | undefined
    for (const [locale, v] of Object.entries(versions) as [Locale, PageData][]) {
      const data = {
        ...published,
        title: v.title,
        slug,
        area: (area ?? undefined) as never,
        parent,
        hero: { type: v.heroImage ? 'image' : 'standard', intro: v.intro, media: v.heroImage },
        layout: v.layout ?? [],
      } as never
      if (id === undefined) id = (await payload.create({ collection: 'pages', locale, data, draft: false })).id
      else await payload.update({ collection: 'pages', id, locale, data, draft: false })
    }
    return id!
  }
  const areaCard = (title: string, textValue: string, pageId: number, mediaId?: number) => ({
    title,
    text: textValue,
    media: mediaId,
    link: { type: 'reference', reference: { relationTo: 'pages', value: pageId } },
  })

  // Bereichsseiten
  const verband = await page('verband', 'verband', {
    de: {
      title: 'Verband',
      intro: 'Der CCVB vertritt die Cheerleading- und Cheerperformance-Vereine in Berlin.',
      layout: [
        { blockType: 'text', content: rt(h('h2', 'Wer wir sind'), p('Der Cheerleading- und Cheerperformance-Verband Berlin e. V. ist der Landesfachverband für Cheersport in Berlin. Wir sind Mitglied im Landessportbund Berlin und im CCVD.'), ul(['Interessen der Vereine vertreten', 'Wettkämpfe ausrichten', 'Trainer*innen aus- und fortbilden'])) },
        { blockType: 'postsList', heading: 'Neues aus dem Verband', area: 'verband', limit: 3 },
        { blockType: 'documentsList', heading: 'Satzung und Ordnungen', populateBy: 'filter', categories: [catOrdnungen], area: 'verband' },
      ],
    },
    ls: {
      title: 'Verband',
      intro: 'Hier steht, was der Verband macht.',
      layout: [{ blockType: 'text', content: rt(p('Wir sind der Verband für Cheerleading in Berlin.'), p('Viele Vereine sind bei uns Mitglied.'), p('Wir machen zum Beispiel:'), ul(['Wett-Kämpfe', 'Kurse für Trainer und Trainerinnen'])) }],
    },
    en: {
      title: 'Association',
      intro: 'CCVB represents cheerleading and cheer performance clubs in Berlin.',
      layout: [{ blockType: 'text', content: rt(p('The Cheerleading and Cheerperformance Association Berlin is the governing body for cheer sport in Berlin.')) }],
    },
  })
  const vorstand = await page('vorstand', 'verband', {
    de: { title: 'Vorstand', intro: 'Ehrenamtlich für den Cheersport in Berlin.', layout: [{ blockType: 'contacts', heading: 'Präsidium', people: [p1, p2, p3] }] },
    en: { title: 'Board', layout: [{ blockType: 'contacts', heading: 'Executive board', people: [p1, p2, p3] }] },
  }, verband)
  const kontakt = await page('kontakt', 'verband', {
    de: { title: 'Kontakt', intro: 'Schreiben Sie uns – wir melden uns so schnell wie möglich.', layout: [{ blockType: 'formBlock', heading: 'Kontaktformular', form: form.id }] },
  }, verband)
  const wettkaempfe = await page('wettkaempfe', 'wettkaempfe', {
    de: {
      title: 'Wettkämpfe',
      heroImage: imgMeisterschaft,
      intro: 'Landesmeisterschaften, Regelwerk und Ausschreibungen.',
      layout: [
        { blockType: 'eventsList', heading: 'Nächste Wettkämpfe', area: 'wettkaempfe', limit: 5 },
        {
          blockType: 'accordion',
          heading: 'Häufige Fragen',
          items: [
            { title: 'Wer darf an der Landesmeisterschaft teilnehmen?', content: rt(p('Alle Teams aus Mitgliedsvereinen des CCVB mit gültiger Startberechtigung.')) },
            { title: 'Bis wann muss ich mein Team anmelden?', content: rt(p('Der Anmeldeschluss steht in der jeweiligen Ausschreibung.')) },
          ],
        },
        { blockType: 'documentsList', heading: 'Regelwerk und Ausschreibungen', populateBy: 'selection', documents: [docRegelwerk, docAusschreibung] },
      ],
    },
    en: { title: 'Competitions', intro: 'State championships, rules and invitations.', layout: [{ blockType: 'eventsList', heading: 'Upcoming competitions', area: 'wettkaempfe', limit: 5 }] },
  })
  const jugend = await page('jugend', 'jugend', {
    de: {
      title: 'Jugend',
      intro: 'Cheersport für Kinder und Jugendliche – sicher und mit Spaß.',
      layout: [
        { blockType: 'imageText', heading: 'Kinderschutz', content: rt(p('Der CCVB trägt das Kinderschutzsiegel des Landessportbunds. Alle Trainer*innen legen ein erweitertes Führungszeugnis vor.')), media: imgCamp, imagePosition: 'right' },
        { blockType: 'contacts', heading: 'Ansprechperson', people: [p3] },
      ],
    },
  })
  const bildung = await page('bildung', 'bildung', { de: { title: 'Bildung', intro: 'Aus- und Fortbildungen für Trainer*innen und Kampfrichter*innen.', layout: [{ blockType: 'text', content: rt(p('Termine für Lizenzlehrgänge finden Sie unter Termine.')) }] } })
  const leistungssport = await page('leistungssport', 'leistungssport', { de: { title: 'Leistungssport', intro: 'Talentförderung und Landeskader.', layout: [{ blockType: 'text', content: rt(p('Informationen zum Talentstützpunkt Berlin folgen.')) }] } })
  const vielfalt = await page('vielfalt', 'vielfalt', { de: { title: 'Vielfalt', intro: 'Cheersport für alle – unabhängig von Herkunft, Geschlecht und Behinderung.', layout: [{ blockType: 'text', content: rt(p('Wir setzen uns für einen inklusiven Sport ein, zum Beispiel mit Para-Cheer-Teams.')) }] } })

  // Rechtliches
  const impressum = await page('impressum', null, {
    de: { title: 'Impressum', layout: [{ blockType: 'text', content: rt(h('h2', 'Angaben gemäß § 5 DDG'), p('Cheerleading- und Cheerperformance-Verband Berlin e. V. (Beispieladresse)'), p('Vertreten durch den Vorstand.')) }] },
    en: { title: 'Legal notice', layout: [{ blockType: 'text', content: rt(p('Cheerleading and Cheerperformance Association Berlin (sample address).')) }] },
  })
  const datenschutz = await page('datenschutz', null, {
    de: { title: 'Datenschutzerklärung', layout: [{ blockType: 'text', content: rt(h('h2', 'Verantwortliche Stelle'), p('Platzhaltertext. Die Website setzt keine Cookies und lädt keine Inhalte von Drittanbietern ohne Ihre Zustimmung.')) }] },
    en: { title: 'Privacy policy', layout: [{ blockType: 'text', content: rt(p('Placeholder text.')) }] },
  })
  const barrierefreiheit = await page('barrierefreiheit', null, {
    de: {
      title: 'Erklärung zur Barrierefreiheit',
      layout: [
        {
          blockType: 'text',
          content: rt(
            p('Der CCVB ist bemüht, seine Website im Einklang mit der BITV 2.0 und den WCAG 2.2 (Stufe AA) barrierefrei zugänglich zu machen.'),
            h('h2', 'Stand der Vereinbarkeit'),
            p('Diese Website ist mit den Anforderungen teilweise vereinbar. (Platzhalter – wird nach dem Prüfbericht ergänzt.)'),
            h('h2', 'Barrieren melden'),
            p('Ist Ihnen eine Barriere aufgefallen? Schreiben Sie uns über das Kontaktformular.'),
            h('h2', 'Schlichtungsverfahren'),
            linkP('Wenn Sie keine zufriedenstellende Antwort erhalten, können Sie sich an die ', 'Schlichtungsstelle nach dem Behindertengleichstellungsgesetz', 'https://www.schlichtungsstelle-bgg.de/'),
          ),
        },
      ],
    },
    ls: { title: 'Barriere-Freiheit', layout: [{ blockType: 'text', content: rt(p('Wir wollen, dass alle Menschen unsere Website benutzen können.'), p('Gibt es ein Problem? Dann schreiben Sie uns bitte.')) }] },
    en: { title: 'Accessibility statement', layout: [{ blockType: 'text', content: rt(p('We aim to make this website accessible in accordance with WCAG 2.2 level AA.')) }] },
  })

  // Startseite
  const cards = (l: Locale) => {
    const t = {
      de: [['Verband', 'Vorstand, Satzung und Kontakt'], ['Jugend', 'Kinderschutz und Jugendarbeit'], ['Wettkämpfe', 'Meisterschaften und Regelwerk'], ['Bildung', 'Lizenzen und Fortbildungen'], ['Leistungssport', 'Talentförderung und Kader'], ['Vielfalt', 'Cheersport für alle']],
      ls: [['Verband', 'Das machen wir'], ['Jugend', 'Für Kinder und Jugendliche'], ['Wett-Kämpfe', 'Meisterschaften'], ['Bildung', 'Kurse'], ['Leistungs-Sport', 'Für sehr gute Sportler'], ['Vielfalt', 'Sport für alle']],
      en: [['Association', 'Board, statutes and contact'], ['Youth', 'Safeguarding and youth work'], ['Competitions', 'Championships and rules'], ['Education', 'Licences and training'], ['Elite sport', 'Talent development'], ['Diversity', 'Cheer for everyone']],
    }[l]
    const pages = [verband, jugend, wettkaempfe, bildung, leistungssport, vielfalt]
    const imgs = [imgTeam, imgCamp, imgMeisterschaft, undefined, undefined, undefined]
    return t.map(([title, txt], i) => areaCard(title, txt, pages[i], imgs[i]))
  }
  await page('home', null, {
    de: {
      title: 'Cheersport in Berlin',
      heroImage: imgHero,
      intro: 'Der Landesverband für Cheerleading und Cheerperformance – für Vereine, Aktive und alle, die es werden wollen.',
      layout: [
        { blockType: 'cardGrid', heading: 'Unsere Bereiche', cards: cards('de') },
        { blockType: 'postsList', heading: 'Aktuelles', limit: 3 },
        { blockType: 'eventsList', heading: 'Termine', limit: 4 },
        { blockType: 'cta', heading: 'Mitglied werden', text: 'Ihr Verein möchte Mitglied im CCVB werden? Wir freuen uns auf Sie.', links: [{ link: { type: 'reference', reference: { relationTo: 'documents', value: docAufnahme }, label: 'Aufnahmeantrag herunterladen', appearance: 'primary' } }, { link: { type: 'reference', reference: { relationTo: 'pages', value: kontakt }, label: 'Kontakt aufnehmen', appearance: 'secondary' } }] },
        { blockType: 'logos', heading: 'Partner', logos: [{ name: 'Landessportbund Berlin', logo: logoLsb, url: 'https://lsb-berlin.de' }, { name: 'CCVD – Cheerleading und Cheerperformance Verband Deutschland', logo: logoCcvd, url: 'https://cheersport.de' }] },
      ],
    },
    ls: {
      title: 'Cheerleading in Berlin',
      heroImage: imgHero,
      intro: 'Das ist die Website vom Verband für Cheerleading in Berlin.',
      layout: [
        { blockType: 'cardGrid', heading: 'Das finden Sie hier', cards: cards('ls') },
        { blockType: 'eventsList', heading: 'Nächste Termine', limit: 3 },
      ],
    },
    en: {
      title: 'Cheer sport in Berlin',
      heroImage: imgHero,
      intro: 'The state association for cheerleading and cheer performance.',
      layout: [
        { blockType: 'cardGrid', heading: 'What we do', cards: cards('en') },
        { blockType: 'postsList', heading: 'News', limit: 3 },
        { blockType: 'eventsList', heading: 'Events', limit: 4 },
      ],
    },
  })

  // ---------- Aktuelles ----------
  payload.logger.info('Aktuelles und Termine …')
  const post = async (slug: string, area: string, categories: number[], publishedAt: string, heroImage: number | undefined, versions: Partial<Record<Locale, { title: string; excerpt: string; content: Lexical }>>) => {
    let id: number | undefined
    for (const [locale, v] of Object.entries(versions) as [Locale, { title: string; excerpt: string; content: Lexical }][]) {
      const data = { ...published, ...v, slug, area: area as never, categories, publishedAt, heroImage } as never
      if (id === undefined) id = (await payload.create({ collection: 'posts', locale, data, draft: false })).id
      else await payload.update({ collection: 'posts', id, locale, data, draft: false })
    }
  }
  await post('einladung-landesverbandstag-2026', 'verband', [catVerband], '2026-09-20T10:00:00.000Z', imgTeam, {
    de: { title: 'Einladung zum Landesverbandstag 2026', excerpt: 'Alle Mitgliedsvereine sind herzlich zum Landesverbandstag am 21. November eingeladen.', content: rt(p('Liebe Mitgliedsvereine,'), p('wir laden Sie herzlich zum Landesverbandstag 2026 ein. Die Tagesordnung und alle Unterlagen finden Sie im Downloadbereich.'), h('h2', 'Tagesordnung'), ul(['Begrüßung', 'Berichte des Vorstands', 'Wahlen', 'Verschiedenes'])) },
    ls: { title: 'Einladung zur Versammlung', excerpt: 'Am 21. November treffen sich alle Vereine.', content: rt(p('Am 21. November gibt es eine Versammlung.'), p('Alle Vereine sind eingeladen.'), p('Dort wird gewählt.')) },
    en: { title: 'Invitation to the 2026 general assembly', excerpt: 'All member clubs are invited to the general assembly on 21 November.', content: rt(p('Dear member clubs, we cordially invite you to the 2026 general assembly.')) },
  })
  await post('trainerin-talentstuetzpunkt-gesucht', 'leistungssport', [catVerband], '2026-08-02T09:00:00.000Z', undefined, {
    de: { title: 'Trainer*in für den Talentstützpunkt gesucht', excerpt: 'Für den Talentstützpunkt Berlin suchen wir ab sofort Verstärkung im Trainingsteam.', content: rt(p('Sie haben eine gültige Trainerlizenz und Freude an der Arbeit mit jungen Talenten? Dann melden Sie sich bei uns.')) },
  })
  await post('ergebnisse-landesmeisterschaft-2026', 'wettkaempfe', [catWettkampf], '2026-05-12T16:00:00.000Z', imgMeisterschaft, {
    de: { title: 'Ergebnisse der Landesmeisterschaft 2026', excerpt: 'Über 40 Teams waren bei der Landesmeisterschaft am Start. Hier sind die Ergebnisse.', content: rt(p('Herzlichen Glückwunsch an alle Teams!'), linkP('Die vollständigen Ergebnisse stehen beim ', 'Bundesverband CCVD', 'https://cheersport.de')) },
    en: { title: '2026 state championship results', excerpt: 'More than 40 teams competed at the state championship.', content: rt(p('Congratulations to all teams!')) },
  })
  await post('kinderschutzsiegel', 'jugend', [catVerband], '2026-03-01T08:00:00.000Z', imgCamp, {
    de: { title: 'CCVB erhält Kinderschutzsiegel', excerpt: 'Der Landessportbund hat dem CCVB das Kinderschutzsiegel verliehen.', content: rt(p('Wir freuen uns sehr über diese Auszeichnung.')) },
  })

  // ---------- Termine ----------
  const inDays = (days: number, hour = 10) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + days)
    d.setUTCHours(hour - 2, 0, 0, 0)
    return d.toISOString()
  }
  const event = async (slug: string, area: string, data: Record<string, unknown>, versions: Partial<Record<Locale, { title: string; excerpt?: string; description?: Lexical }>>) => {
    let id: number | undefined
    for (const [locale, v] of Object.entries(versions) as [Locale, Record<string, unknown>][]) {
      const d = { ...published, ...data, ...v, slug, area: area as never } as never
      if (id === undefined) id = (await payload.create({ collection: 'events', locale, data: d, draft: false })).id
      else await payload.update({ collection: 'events', id, locale, data: d, draft: false })
    }
  }
  await event('landesverbandstag-2026', 'verband', { startDate: inDays(44, 11), endDate: inDays(44, 15), location: { name: 'Haus des Sports', address: 'Jesse-Owens-Allee 2, 14053 Berlin' }, documents: [docProtokoll] }, {
    de: { title: 'Landesverbandstag 2026', excerpt: 'Jahreshauptversammlung aller Mitgliedsvereine.', description: rt(p('Stimmberechtigt sind die Delegierten der Mitgliedsvereine.')) },
    ls: { title: 'Versammlung vom Verband', excerpt: 'Alle Vereine treffen sich.' },
    en: { title: 'General assembly 2026', excerpt: 'Annual general meeting of all member clubs.' },
  })
  await event('landesmeisterschaft-2027', 'wettkaempfe', { startDate: inDays(120, 9), endDate: inDays(121, 18), location: { name: 'Sporthalle Schöneberg', address: 'Sachsendamm 12, 10829 Berlin' }, registrationUrl: 'https://example.org/anmeldung', registrationDeadline: inDays(90), documents: [docAusschreibung, docRegelwerk] }, {
    de: { title: 'Landesmeisterschaft 2027', excerpt: 'Die Berliner Landesmeisterschaft im Cheerleading und Cheerperformance.', description: rt(p('Zwei Wettkampftage mit allen Altersklassen.'), h('h2', 'Ablauf'), ul(['Samstag: Junior und Youth', 'Sonntag: Senior und Para-Cheer'])) },
    en: { title: 'State Championship 2027', excerpt: 'The Berlin state championship in cheerleading and cheer performance.' },
  })
  await event('trainerlizenz-c-lehrgang', 'bildung', { startDate: inDays(30, 9), allDay: true, location: { name: 'Online' } }, {
    de: { title: 'Lehrgang Trainerlizenz C – Modul 1', excerpt: 'Grundlagenmodul für angehende Trainer*innen.' },
  })
  await event('sommercamp-2026', 'jugend', { startDate: inDays(-40, 10), endDate: inDays(-37, 16), location: { name: 'Sportschule Lindow' } }, {
    de: { title: 'Sommercamp 2026', excerpt: 'Vier Tage Training, Teamspiel und Spaß für Kinder und Jugendliche.' },
  })

  // ---------- Navigation und Footer ----------
  payload.logger.info('Navigation und Footer …')
  const ref = (relationTo: 'pages', value: number, label: string) => ({ link: { type: 'reference', reference: { relationTo, value }, label } })
  const custom = (url: string, label: string) => ({ link: { type: 'custom', url, label } })
  const nav: Record<Locale, unknown[]> = {
    de: [
      { ...ref('pages', verband, 'Verband'), children: [ref('pages', vorstand, 'Vorstand'), ref('pages', kontakt, 'Kontakt'), custom('/downloads/', 'Downloads')] },
      { ...ref('pages', jugend, 'Jugend'), children: [] },
      { ...ref('pages', wettkaempfe, 'Wettkämpfe'), children: [custom('/termine/', 'Termine'), custom('/aktuelles/', 'Aktuelles')] },
      { ...ref('pages', bildung, 'Bildung'), children: [] },
      { ...ref('pages', leistungssport, 'Leistungssport'), children: [] },
      { ...ref('pages', vielfalt, 'Vielfalt'), children: [] },
    ],
    ls: [
      { ...ref('pages', verband, 'Verband'), children: [] },
      { ...custom('/leichte-sprache/termine/', 'Termine'), children: [] },
      { ...custom('/leichte-sprache/aktuelles/', 'Neuigkeiten'), children: [] },
    ],
    en: [
      { ...ref('pages', verband, 'Association'), children: [ref('pages', vorstand, 'Board')] },
      { ...ref('pages', wettkaempfe, 'Competitions'), children: [custom('/en/events/', 'Events')] },
      { ...custom('/en/news/', 'News'), children: [] },
    ],
  }
  const service: Record<Locale, unknown[]> = {
    de: [ref('pages', kontakt, 'Kontakt'), custom('/downloads/', 'Downloads')],
    ls: [],
    en: [custom('/en/downloads/', 'Downloads')],
  }
  const footerLinks: Record<Locale, unknown[]> = {
    de: [ref('pages', impressum, 'Impressum'), ref('pages', datenschutz, 'Datenschutz'), ref('pages', barrierefreiheit, 'Erklärung zur Barrierefreiheit')],
    ls: [ref('pages', barrierefreiheit, 'Barriere-Freiheit'), ref('pages', impressum, 'Impressum')],
    en: [ref('pages', impressum, 'Legal notice'), ref('pages', datenschutz, 'Privacy policy'), ref('pages', barrierefreiheit, 'Accessibility statement')],
  }
  for (const locale of ['de', 'ls', 'en'] as const) {
    await payload.updateGlobal({ slug: 'header', locale, data: { mainNav: nav[locale], serviceNav: service[locale] } as never })
    await payload.updateGlobal({
      slug: 'footer',
      locale,
      data: {
        contact: { organization: 'Cheerleading- und Cheerperformance-Verband Berlin e. V.', address: 'Musterstraße 1\n10115 Berlin', email: 'info@example.org', phone: '030 1234567' },
        links: footerLinks[locale],
        social: [{ platform: 'instagram', url: 'https://www.instagram.com/' }, { platform: 'facebook', url: 'https://www.facebook.com/' }],
      } as never,
    })
  }
}

async function reset(payload: Payload) {
  for (const collection of ['pages', 'posts', 'events', 'people', 'documents', 'media', 'categories', 'forms', 'form-submissions'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
}

const payload = await getPayload({ config })
const home = await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1, draft: true })
if (home.totalDocs > 0 && !process.argv.includes('--force')) {
  payload.logger.info('Es gibt schon eine Startseite – nichts zu tun. (--force löscht und legt neu an)')
} else {
  if (home.totalDocs > 0) await reset(payload)
  await seed(payload)
  payload.logger.info('Beispielinhalte angelegt.')
}
process.exit(0)
