import * as Effect from 'effect/Effect'
import ProjectRepository from '../repositories/ProjectRepository'

const GetActiveProjects = Effect.fn('GetActiveProjects')(function* () {
  const projectRepository = yield* ProjectRepository

  return yield* projectRepository.getActive
})

export default GetActiveProjects
