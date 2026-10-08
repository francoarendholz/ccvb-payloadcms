import type { Config } from '@ccvb/shared/payload-types'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Modul-Erweiterung
declare module 'payload' {
  export interface GeneratedTypes extends Config {}
}
