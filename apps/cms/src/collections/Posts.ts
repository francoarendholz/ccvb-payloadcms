import { slugField, type CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { authenticated, isEditor, publicRead, publishedOrVerified } from '@/access'
import { inlineBlocks } from '@/blocks'
import { areaField } from '@/fields/area'
import { seoTab } from '@/fields/seo'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { previewUrl } from '@/utilities/previewUrl'
import { reviewFields } from '@/workflow/fields'
import { workflowHooks } from '@/workflow/hooks'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: { singular: 'Beitrag', plural: 'Aktuelles' },
  custom: publicRead,
  access: {
    create: authenticated,
    delete: isEditor,
    read: publishedOrVerified,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    excerpt: true,
    heroImage: true,
    publishedAt: true,
    categories: true,
    area: true,
  },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'title',
    components: { edit: { PublishButton: '@/components/PublishButton#PublishButton' } },
    defaultColumns: ['title', 'categories', 'area', 'publishedAt', 'reviewStatus', '_status'],
    livePreview: { url: ({ data, req }) => previewUrl({ collection: 'posts', id: data?.id, req }) },
    preview: (data, { req }) => previewUrl({ collection: 'posts', id: data?.id as string, req }),
  },
  fields: [
    { name: 'title', type: 'text', label: 'Titel', required: true, localized: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Inhalt',
          fields: [
            { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Titelbild' },
            {
              name: 'excerpt',
              type: 'textarea',
              label: 'Teaser',
              localized: true,
              maxLength: 300,
              admin: { description: 'Kurze Zusammenfassung für Übersichten (max. 300 Zeichen).' },
            },
            {
              name: 'content',
              type: 'richText',
              label: 'Text',
              localized: true,
              required: true,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures,
                  BlocksFeature({ blocks: inlineBlocks }),
                ],
              }),
            },
          ],
        },
        seoTab,
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Datum',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Kategorien',
      filterOptions: { type: { equals: 'posts' } },
      admin: { position: 'sidebar' },
    },
    areaField(),
    ...reviewFields,
    slugField(),
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
