import * as Effect from 'effect/Effect'
import ProjectRepository from '#/server/application/repositories/ProjectRepository'
import type { TGetProjectDirectoriesInput } from '#/shared/contracts/Project'

const GetProjectDirectories = Effect.fn('GetProjectDirectories')(function* (
  input: TGetProjectDirectoriesInput
) {
  const projectRepository = yield* ProjectRepository

  return yield* projectRepository.getDirectories(input)
})

export default GetProjectDirectories
