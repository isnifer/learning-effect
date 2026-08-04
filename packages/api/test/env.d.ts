import type { D1Migration } from '@cloudflare/vitest-pool-workers'

declare global {
  namespace Cloudflare {
    interface Env {
      readonly TEST_MIGRATIONS: Array<D1Migration>
    }
  }
}
