import { slugField, type CollectionConfig } from 'payload'

import { authenticated, authenticatedOrPublished, isEditor } from '@/access'
import { areaField } from '@/fields/area'
import { richTextEditor } from '@/fields/lexical'
import { seoTab } from '@/fields/seo'
import { previewUrl } from '@/utilities/previewUrl'

export const Events: CollectionConfig<'events'> = {
  slug: 'events',
  labels: { singular: 'Termin', plural: 'Termine' },
  access: {
    create: authenticated,
    delete: isEditor,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    startDate: true,
    endDate: true,
    allDay: true,
    location: true,
    area: true,
  },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'area', '_status'],
    livePreview: { url: ({ data, req }) => previewUrl({ collection: 'events', id: data?.id, req }) },
    preview: (data, { req }) => previewUrl({ collection: 'events', id: data?.id as string, req }),
  },
  fields: [
    { name: 'title', type: 'text', label: 'Titel', required: true, localized: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Termin',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'startDate',
                  type: 'date',
                  label: 'Beginn',
                  required: true,
                  admin: { width: '40%', date: { pickerAppearance: 'dayAndTime' } },
                },
                {
                  name: 'endDate',
                  type: 'date',
                  label: 'Ende',
                  admin: { width: '40%', date: { pickerAppearance: 'dayAndTime' } },
                  validate: (value, { siblingData }) => {
                    const start = (siblingData as { startDate?: string })?.startDate
                    if (value && start && new Date(value) < new Date(start)) {
                      return 'Das Ende muss nach dem Beginn liegen.'
                    }
                    return true
                  },
                },
                {
                  name: 'allDay',
                  type: 'checkbox',
                  label: 'Ganztägig',
                  admin: { width: '20%', style: { alignSelf: 'flex-end' } },
                },
              ],
            },
            {
              name: 'location',
              type: 'group',
              label: 'Ort',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'Name', admin: { width: '50%' } },
                    { name: 'address', type: 'text', label: 'Adresse', admin: { width: '50%' } },
                  ],
                },
              ],
            },
            { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Bild' },
            {
              name: 'excerpt',
              type: 'textarea',
              label: 'Kurzbeschreibung',
              localized: true,
              maxLength: 300,
            },
            {
              name: 'description',
              type: 'richText',
              label: 'Beschreibung',
              localized: true,
              editor: richTextEditor,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'registrationUrl',
                  type: 'text',
                  label: 'Anmeldelink',
                  admin: { width: '50%' },
                },
                {
                  name: 'registrationDeadline',
                  type: 'date',
                  label: 'Anmeldeschluss',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'documents',
              type: 'relationship',
              relationTo: 'documents',
              hasMany: true,
              label: 'Dokumente (Ausschreibung, Zeitplan …)',
            },
          ],
        },
        seoTab,
      ],
    },
    areaField(),
    slugField(),
  ],
  versions: {
    drafts: { autosave: { interval: 2000 }, schedulePublish: true },
    maxPerDoc: 30,
  },
}
