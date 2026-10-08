import type { CollectionConfig } from 'payload'
import path from 'path'

import { anyone, authenticated, isEditor } from '@/access'

const webp = { format: 'webp' as const, options: { quality: 80 } }

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Bild', plural: 'Bilder' },
  admin: { group: 'Medien & Dateien', useAsTitle: 'alt' },
  folders: true,
  access: { create: authenticated, read: anyone, update: authenticated, delete: isEditor },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alternativtext',
      required: true,
      localized: true,
      admin: {
        description:
          'Beschreibt, was auf dem Bild zu sehen ist – für Menschen, die das Bild nicht sehen können. Pflichtfeld für Barrierefreiheit.',
      },
    },
    { name: 'credit', type: 'text', label: 'Bildnachweis / Fotograf*in' },
  ],
  upload: {
    staticDir: path.resolve(process.env.MEDIA_DIR || 'media', 'images'),
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    formatOptions: webp,
    imageSizes: [
      { name: 'thumbnail', width: 320, formatOptions: webp },
      { name: 'small', width: 640, formatOptions: webp },
      { name: 'medium', width: 960, formatOptions: webp },
      { name: 'large', width: 1440, formatOptions: webp },
      { name: 'xlarge', width: 1920, formatOptions: webp },
      { name: 'og', width: 1200, height: 630, crop: 'center', formatOptions: { format: 'jpeg' } },
    ],
  },
}
