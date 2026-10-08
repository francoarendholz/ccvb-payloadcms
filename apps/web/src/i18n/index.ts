import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from '@ccvb/shared'

export { DEFAULT_LOCALE, LOCALES, type LocaleCode }

export const localeInfo = (locale: LocaleCode) => LOCALES.find((l) => l.code === locale)!

/** Feste Bereiche der Website – URL-Segment je Sprache. */
export const SECTIONS = {
  posts: { de: 'aktuelles', ls: 'aktuelles', en: 'news' },
  events: { de: 'termine', ls: 'termine', en: 'events' },
  downloads: { de: 'downloads', ls: 'downloads', en: 'downloads' },
  search: { de: 'suche', ls: 'suche', en: 'search' },
  thanks: { de: 'danke', ls: 'danke', en: 'thank-you' },
} as const satisfies Record<string, Record<LocaleCode, string>>

export type Section = keyof typeof SECTIONS

/** Baut eine URL mit Sprachpräfix: `localePath('en', 'news', 'foo')` → `/en/news/foo/`. */
export const localePath = (locale: LocaleCode, ...segments: (string | undefined | null)[]) => {
  const rest = segments
    .flatMap((s) => (s ?? '').split('/'))
    .filter(Boolean)
    .join('/')
  const path = `${localeInfo(locale).prefix}/${rest}`
  return path.endsWith('/') ? path : `${path}/`
}

export const sectionPath = (locale: LocaleCode, section: Section, ...rest: string[]) =>
  localePath(locale, SECTIONS[section][locale], ...rest)

const ui = {
  de: {
    siteName: 'Cheerleading- und Cheerperformance-Verband Berlin',
    siteShort: 'CCVB',
    skipLink: 'Zum Inhalt springen',
    home: 'Startseite',
    mainNav: 'Hauptnavigation',
    serviceNav: 'Servicenavigation',
    footerNav: 'Rechtliches und Service',
    breadcrumb: 'Brotkrümelnavigation',
    menu: 'Menü',
    submenu: (label: string) => `Untermenü ${label}`,
    language: 'Sprache',
    languageSwitch: 'Sprache wählen',
    posts: 'Aktuelles',
    events: 'Termine',
    downloads: 'Downloads',
    search: 'Suche',
    searchLabel: 'Website durchsuchen',
    searchNoJs: 'Die Suche benötigt JavaScript. Alternativ finden Sie alle Inhalte über die Navigation.',
    readMore: (title: string) => `Weiterlesen: ${title}`,
    allPosts: 'Alle Meldungen',
    allEvents: 'Alle Termine',
    allDownloads: 'Alle Downloads',
    noPosts: 'Zurzeit gibt es keine Meldungen.',
    noEvents: 'Zurzeit sind keine Termine geplant.',
    noDocuments: 'Keine Dokumente gefunden.',
    upcoming: 'Kommende Termine',
    past: 'Vergangene Termine',
    date: 'Datum',
    time: 'Uhrzeit',
    location: 'Ort',
    allDay: 'ganztägig',
    oclock: 'Uhr',
    registration: 'Zur Anmeldung',
    registrationDeadline: 'Anmeldeschluss',
    documents: 'Dokumente',
    contact: 'Kontakt',
    email: 'E-Mail',
    phone: 'Telefon',
    category: 'Kategorie',
    area: 'Bereich',
    all: 'Alle',
    filter: 'Filtern',
    resetFilter: 'Filter zurücksetzen',
    validFrom: 'Stand',
    download: (title: string, meta: string) => `${title} herunterladen (${meta})`,
    externalLink: '(externer Link)',
    newTab: '(öffnet in neuem Tab)',
    pagination: 'Seitennavigation',
    previous: 'Vorherige Seite',
    next: 'Nächste Seite',
    page: (n: number, total: number) => `Seite ${n} von ${total}`,
    published: 'Veröffentlicht am',
    imageCredit: 'Foto',
    gallery: (n: number, total: number) => `Bild ${n} von ${total}`,
    socialMedia: 'Social Media',
    required: 'Pflichtfeld',
    requiredHint: 'Felder mit * sind Pflichtfelder.',
    submit: 'Absenden',
    thanksTitle: 'Vielen Dank!',
    thanksText: 'Ihre Nachricht ist bei uns angekommen.',
    formError: 'Das Formular konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
    notFoundTitle: 'Seite nicht gefunden',
    notFoundText: 'Die aufgerufene Seite gibt es nicht (mehr). Vielleicht hilft Ihnen die Suche oder die Startseite weiter.',
    backHome: 'Zur Startseite',
    embedConsent: (service: string) => `Inhalt von ${service} laden`,
    embedNotice: (service: string) =>
      `Beim Laden werden Daten an ${service} übertragen. Mehr dazu in der Datenschutzerklärung.`,
  },
  ls: {
    siteName: 'Cheerleading- und Cheerperformance-Verband Berlin',
    siteShort: 'CCVB',
    skipLink: 'Zum Inhalt springen',
    home: 'Start-Seite',
    mainNav: 'Haupt-Menü',
    serviceNav: 'Weitere Links',
    footerNav: 'Rechtliches',
    breadcrumb: 'Sie sind hier',
    menu: 'Menü',
    submenu: (label: string) => `Mehr zu ${label}`,
    language: 'Sprache',
    languageSwitch: 'Sprache wählen',
    posts: 'Neuigkeiten',
    events: 'Termine',
    downloads: 'Dateien',
    search: 'Suche',
    searchLabel: 'Auf der Website suchen',
    searchNoJs: 'Die Suche geht nur mit JavaScript. Sie können aber das Menü benutzen.',
    readMore: (title: string) => `Mehr lesen: ${title}`,
    allPosts: 'Alle Neuigkeiten',
    allEvents: 'Alle Termine',
    allDownloads: 'Alle Dateien',
    noPosts: 'Im Moment gibt es keine Neuigkeiten.',
    noEvents: 'Im Moment gibt es keine Termine.',
    noDocuments: 'Wir haben keine Dateien gefunden.',
    upcoming: 'Nächste Termine',
    past: 'Frühere Termine',
    date: 'Datum',
    time: 'Uhr-Zeit',
    location: 'Ort',
    allDay: 'den ganzen Tag',
    oclock: 'Uhr',
    registration: 'Hier anmelden',
    registrationDeadline: 'Anmelden bis',
    documents: 'Dateien',
    contact: 'Kontakt',
    email: 'E-Mail',
    phone: 'Telefon',
    category: 'Art',
    area: 'Bereich',
    all: 'Alle',
    filter: 'Suchen',
    resetFilter: 'Alles zeigen',
    validFrom: 'Stand',
    download: (title: string, meta: string) => `${title} herunterladen (${meta})`,
    externalLink: '(Link zu einer anderen Website)',
    newTab: '(öffnet in neuem Fenster)',
    pagination: 'Seiten',
    previous: 'Vorherige Seite',
    next: 'Nächste Seite',
    page: (n: number, total: number) => `Seite ${n} von ${total}`,
    published: 'Veröffentlicht am',
    imageCredit: 'Foto',
    gallery: (n: number, total: number) => `Bild ${n} von ${total}`,
    socialMedia: 'Soziale Medien',
    required: 'Muss ausgefüllt werden',
    requiredHint: 'Felder mit * müssen Sie ausfüllen.',
    submit: 'Abschicken',
    thanksTitle: 'Vielen Dank!',
    thanksText: 'Wir haben Ihre Nachricht bekommen.',
    formError: 'Das hat leider nicht geklappt. Bitte versuchen Sie es später noch einmal.',
    notFoundTitle: 'Diese Seite gibt es nicht',
    notFoundText: 'Wir haben die Seite nicht gefunden. Gehen Sie zur Start-Seite oder benutzen Sie die Suche.',
    backHome: 'Zur Start-Seite',
    embedConsent: (service: string) => `Inhalt von ${service} anzeigen`,
    embedNotice: (service: string) =>
      `Dann bekommt ${service} Daten von Ihnen. Mehr dazu steht in der Datenschutz-Erklärung.`,
  },
  en: {
    siteName: 'Cheerleading and Cheerperformance Association Berlin',
    siteShort: 'CCVB',
    skipLink: 'Skip to content',
    home: 'Home',
    mainNav: 'Main navigation',
    serviceNav: 'Service navigation',
    footerNav: 'Legal and service',
    breadcrumb: 'Breadcrumb',
    menu: 'Menu',
    submenu: (label: string) => `Submenu ${label}`,
    language: 'Language',
    languageSwitch: 'Choose language',
    posts: 'News',
    events: 'Events',
    downloads: 'Downloads',
    search: 'Search',
    searchLabel: 'Search this website',
    searchNoJs: 'Search requires JavaScript. You can find all content via the navigation.',
    readMore: (title: string) => `Read more: ${title}`,
    allPosts: 'All news',
    allEvents: 'All events',
    allDownloads: 'All downloads',
    noPosts: 'There is no news at the moment.',
    noEvents: 'There are no upcoming events.',
    noDocuments: 'No documents found.',
    upcoming: 'Upcoming events',
    past: 'Past events',
    date: 'Date',
    time: 'Time',
    location: 'Location',
    allDay: 'all day',
    oclock: '',
    registration: 'Register',
    registrationDeadline: 'Registration deadline',
    documents: 'Documents',
    contact: 'Contact',
    email: 'Email',
    phone: 'Phone',
    category: 'Category',
    area: 'Section',
    all: 'All',
    filter: 'Filter',
    resetFilter: 'Reset filter',
    validFrom: 'Version',
    download: (title: string, meta: string) => `Download ${title} (${meta})`,
    externalLink: '(external link)',
    newTab: '(opens in a new tab)',
    pagination: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    page: (n: number, total: number) => `Page ${n} of ${total}`,
    published: 'Published on',
    imageCredit: 'Photo',
    gallery: (n: number, total: number) => `Image ${n} of ${total}`,
    socialMedia: 'Social media',
    required: 'required',
    requiredHint: 'Fields marked * are required.',
    submit: 'Send',
    thanksTitle: 'Thank you!',
    thanksText: 'We have received your message.',
    formError: 'The form could not be sent. Please try again later.',
    notFoundTitle: 'Page not found',
    notFoundText: 'This page does not exist (anymore). Try the search or go to the home page.',
    backHome: 'Go to home page',
    embedConsent: (service: string) => `Load content from ${service}`,
    embedNotice: (service: string) =>
      `Loading transfers data to ${service}. See our privacy policy for details.`,
  },
} satisfies Record<LocaleCode, unknown>

export type UiStrings = (typeof ui)['de']

export const t = (locale: LocaleCode): UiStrings => ui[locale]

/** Bezeichnungen der Bereiche je Sprache. */
export const AREA_LABELS: Record<LocaleCode, Record<string, string>> = {
  de: {
    verband: 'Verband',
    jugend: 'Jugend',
    wettkaempfe: 'Wettkämpfe',
    bildung: 'Bildung',
    leistungssport: 'Leistungssport',
    vielfalt: 'Vielfalt',
  },
  ls: {
    verband: 'Verband',
    jugend: 'Jugend',
    wettkaempfe: 'Wett-Kämpfe',
    bildung: 'Bildung',
    leistungssport: 'Leistungs-Sport',
    vielfalt: 'Vielfalt',
  },
  en: {
    verband: 'Association',
    jugend: 'Youth',
    wettkaempfe: 'Competitions',
    bildung: 'Education',
    leistungssport: 'Elite sport',
    vielfalt: 'Diversity',
  },
}

const intlLocale = (locale: LocaleCode) => (locale === 'en' ? 'en-GB' : 'de-DE')
const TZ = 'Europe/Berlin'

export const formatDate = (locale: LocaleCode, iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
    ...opts,
  }).format(new Date(iso))

export const formatTime = (locale: LocaleCode, iso: string) => {
  const time = new Intl.DateTimeFormat(intlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(iso))
  const suffix = t(locale).oclock
  return suffix ? `${time} ${suffix}` : time
}

/** Datum ohne Uhrzeit als `YYYY-MM-DD` in Berliner Zeit (für `<time datetime>` und Vergleiche). */
export const isoDay = (iso: string) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date(iso))
