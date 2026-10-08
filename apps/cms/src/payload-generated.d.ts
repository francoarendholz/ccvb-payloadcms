import type { Config } from '@ccvb/shared/payload-types'

declare module 'payload' {
  export interface GeneratedTypes extends Config {}
}
