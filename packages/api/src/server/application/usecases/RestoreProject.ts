import * as Effect from 'effect/Effect'
import type { TRestoreProjectInput } from '#/shared/contracts/Project'
import ProjectRepository from '../repositories/ProjectRepository'

const RestoreProject = Effect.fn('RestoreProject')(function* (input: TRestoreProjectInput) {
  const projectRepository = yield* ProjectRepository

  return yield* projectRepository.restore(input)
})

export default RestoreProject
