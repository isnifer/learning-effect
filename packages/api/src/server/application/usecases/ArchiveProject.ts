import * as Effect from 'effect/Effect'
import type { TArchiveProjectInput } from '#/shared/contracts/Project'
import ProjectRepository from '../repositories/ProjectRepository'

const ArchiveProject = Effect.fn('ArchiveProject')(function* (input: TArchiveProjectInput) {
  const projectRepository = yield* ProjectRepository

  return yield* projectRepository.archive(input)
})

export default ArchiveProject
