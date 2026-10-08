import type { Block } from 'payload'

import { blockHeading } from '@/fields/blockHeading'
import { areaField } from '@/fields/area'

export const EventsListBlock: Block = {
  slug: 'eventsList',
  interfaceName: 'EventsListBlock',
  labels: { singular: 'Liste: Termine', plural: 'Listen: Termine' },
  fields: [
    blockHeading(),
    areaField({ admin: { description: 'Leer lassen für alle Bereiche.' } }),
    { name: 'limit', type: 'number', label: 'Anzahl', defaultValue: 5, min: 1, max: 20 },
  ],
}
