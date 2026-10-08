import type { GlobalConfig } from 'payload'

import { anyone, isAdmin, publicRead } from '@/access'
import { link } from '@/fields/link'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer & Kontakt',
  admin: { group: 'Einstellungen' },
  custom: publicRead,
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: 'contact',
      type: 'group',
      label: 'Kontakt (Geschäftsstelle)',
      fields: [
        { name: 'organization', type: 'text', label: 'Name', defaultValue: 'Cheerleading- und Cheerperformance-Verband Berlin e. V.' },
        { name: 'address', type: 'textarea', label: 'Anschrift' },
        {
          type: 'row',
          fields: [
            { name: 'email', type: 'email', label: 'E-Mail', admin: { width: '50%' } },
            { name: 'phone', type: 'text', label: 'Telefon', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'links',
      type: 'array',
      label: 'Footer-Links (Impressum, Datenschutz, Barrierefreiheit …)',
      labels: { singular: 'Link', plural: 'Links' },
      localized: true,
      admin: { initCollapsed: true },
      fields: [link({ appearances: false })],
    },
    {
      name: 'social',
      type: 'array',
      label: 'Social Media',
      labels: { singular: 'Profil', plural: 'Profile' },
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              type: 'select',
              label: 'Plattform',
              required: true,
              options: [
                { label: 'Instagram', value: 'instagram' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'YouTube', value: 'youtube' },
                { label: 'TikTok', value: 'tiktok' },
              ],
              admin: { width: '30%' },
            },
            { name: 'url', type: 'text', label: 'URL', required: true, admin: { width: '70%' } },
          ],
        },
      ],
    },
  ],
}
