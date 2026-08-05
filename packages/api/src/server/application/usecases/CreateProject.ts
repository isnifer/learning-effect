import * as Effect from 'effect/Effect'
import ProjectRepository from '#/server/application/repositories/ProjectRepository'
import type { TCreateProjectInput } from '#/shared/contracts/Project'

const CreateProject = Effect.fn('CreateProject')(function* (input: TCreateProjectInput) {
  const projectRepository = yield* ProjectRepository

  return yield* projectRepository.create(input)
})

export default CreateProject
