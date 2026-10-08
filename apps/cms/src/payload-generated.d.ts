import type { Config } from '@ccvb/shared/payload-types'

declare module 'payload' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Modul-Erweiterung
  export interface GeneratedTypes extends Config {}
}
