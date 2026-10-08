/**
 * Umgebungsvariablen – zur Build-Zeit aus `.env`, zur Laufzeit (SSR-Routen) aus der Prozessumgebung.
 */
const read = (name: string): string =>
  (typeof process !== 'undefined' ? process.env[name] : undefined) ??
  (import.meta.env[name] as string | undefined) ??
  ''

export const env = {
  get cmsUrl() {
    return (read('CMS_URL') || 'http://localhost:3000').replace(/\/$/, '')
  },
  get mediaUrl() {
    return read('MEDIA_URL').replace(/\/$/, '')
  },
  get previewSecret() {
    return read('PREVIEW_SECRET')
  },
  get cmsApiKey() {
    return read('CMS_API_KEY')
  },
}
