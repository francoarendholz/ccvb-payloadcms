import { slugField, type CollectionConfig } from 'payload'

import { authenticated, isEditor, publicRead, publishedOrVerified } from '@/access'
import { layoutBlocks } from '@/blocks'
import { areaField } from '@/fields/area'
import { seoTab } from '@/fields/seo'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { previewUrl } from '@/utilities/previewUrl'
import { reviewFields } from '@/workflow/fields'
import { workflowHooks } from '@/workflow/hooks'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  labels: { singular: 'Seite', plural: 'Seiten' },
  custom: publicRead,
  access: {
    create: authenticated,
    delete: isEditor,
    read: publishedOrVerified,
    update: authenticated,
  },
  defaultPopulate: { title: true, slug: true, breadcrumbs: true },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent', 'area', 'reviewStatus', '_status'],
    livePreview: { url: ({ data, req }) => previewUrl({ collection: 'pages', id: data?.id, req }) },
    preview: (data, { req }) => previewUrl({ collection: 'pages', id: data?.id as string, req }),
  },
  fields: [
    { name: 'title', type: 'text', label: 'Titel', required: true, localized: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Kopfbereich',
          fields: [
            {
              name: 'hero',
              type: 'group',
              label: false,
              localized: true,
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  label: 'Art',
                  defaultValue: 'standard',
                  required: true,
                  options: [
                    { label: 'Nur Titel', value: 'standard' },
                    { label: 'Großes Bild', value: 'image' },
                  ],
                },
                { name: 'intro', type: 'textarea', label: 'Einleitungstext' },
                {
                  name: 'media',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Bild',
                  required: true,
                  admin: { condition: (_, siblingData) => siblingData?.type === 'image' },
                },
              ],
            },
          ],
        },
        {
          label: 'Inhalt',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              label: 'Inhaltsblöcke',
              blocks: layoutBlocks,
              localized: true,
              admin: { initCollapsed: true },
            },
          ],
        },
        seoTab,
      ],
    },
    areaField(),
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Veröffentlicht am',
      admin: { position: 'sidebar' },
    },
    // Slug ist nur innerhalb der Elternseite eindeutig – die URL ergibt sich aus den Breadcrumbs.
    ...reviewFields,
    slugField({ disableUnique: true }),
  ],
  hooks: {
    beforeChange: [populatePublishedAt, ...workflowHooks.beforeChange],
    afterChange: workflowHooks.afterChange,
  },
  versions: {
    drafts: { autosave: { interval: 2000 }, schedulePublish: true },
    maxPerDoc: 50,
  },
}
