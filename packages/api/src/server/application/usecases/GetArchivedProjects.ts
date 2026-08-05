import * as Effect from 'effect/Effect'
import ProjectRepository from '../repositories/ProjectRepository'

const GetArchivedProjects = Effect.fn('GetArchivedProjects')(function* () {
  const projectRepository = yield* ProjectRepository

  return yield* projectRepository.getArchived
})

export default GetArchivedProjects
