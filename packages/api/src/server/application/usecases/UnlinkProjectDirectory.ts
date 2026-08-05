import * as Effect from 'effect/Effect'
import type { TUnlinkProjectDirectoryInput } from '#/shared/contracts/Project'
import ProjectRepository from '../repositories/ProjectRepository'

const UnlinkProjectDirectory = Effect.fn('UnlinkProjectDirectory')(function* (
  input: TUnlinkProjectDirectoryInput
) {
  const projectRepository = yield* ProjectRepository

  return yield* projectRepository.unlinkDirectory(input)
})

export default UnlinkProjectDirectory
