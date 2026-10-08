import type { TextFieldSingleValidation } from 'payload'
import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
  type LinkFields,
} from '@payloadcms/richtext-lexical'

/**
 * Bewusst schlanke Toolbar: keine H1 (die vergibt die Seite), kein Unterstreichen
 * (wird mit Links verwechselt), keine Farben/Schriftgrößen.
 */
const baseFeatures = [
  ParagraphFeature(),
  BoldFeature(),
  ItalicFeature(),
  UnorderedListFeature(),
  OrderedListFeature(),
  LinkFeature({
    enabledCollections: ['pages', 'posts', 'events', 'documents'],
    fields: ({ defaultFields }) => [
      ...defaultFields.filter((field) => !('name' in field && field.name === 'url')),
      {
        name: 'url',
        type: 'text',
        label: 'URL',
        required: true,
        admin: {
          condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
        },
        validate: ((value, options) => {
          if ((options?.siblingData as LinkFields)?.linkType === 'internal') return true
          return value ? true : 'Bitte eine URL angeben.'
        }) as TextFieldSingleValidation,
      },
    ],
  }),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
]

/** Fließtext mit Zwischenüberschriften H2–H4. */
export const richTextEditor = lexicalEditor({
  features: [...baseFeatures, HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] })],
})

/** Kurztexte innerhalb von Blöcken – Überschriften vergibt der Block selbst. */
export const simpleTextEditor = lexicalEditor({ features: baseFeatures })
