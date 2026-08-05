import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { ProjectDirectoryPath } from './Project'

describe('ProjectDirectoryPath', () => {
  it.effect('decode: preserves whitespace that belongs to an absolute path', () =>
    Effect.gen(function* () {
      const absolutePath = '/tmp/red-docket '

      const decodedPath = yield* Schema.decodeUnknownEffect(ProjectDirectoryPath)(absolutePath)

      expect(decodedPath).toBe(absolutePath)
    })
  )

  it.effect('decode: rejects a path containing a null byte', () =>
    Effect.gen(function* () {
      const error = yield* Schema.decodeUnknownEffect(ProjectDirectoryPath)(
        '/tmp/red-docket\0invalid'
      ).pipe(Effect.flip)

      expect(error._tag).toBe('SchemaError')
    })
  )
})
