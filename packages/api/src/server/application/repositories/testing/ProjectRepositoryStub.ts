import * as Effect from 'effect/Effect'
import ProjectRepository from '../ProjectRepository'

const ProjectRepositoryStub: ProjectRepository['Service'] = {
  create: () => Effect.die(new Error('Unexpected ProjectRepository.create')),
  getActive: Effect.die(new Error('Unexpected ProjectRepository.getActive')),
  getById: () => Effect.die(new Error('Unexpected ProjectRepository.getById')),
  getActiveById: () => Effect.die(new Error('Unexpected ProjectRepository.getActiveById')),
  archive: () => Effect.die(new Error('Unexpected ProjectRepository.archive')),
  restore: () => Effect.die(new Error('Unexpected ProjectRepository.restore')),
  getDirectories: () => Effect.die(new Error('Unexpected ProjectRepository.getDirectories')),
  linkDirectory: () => Effect.die(new Error('Unexpected ProjectRepository.linkDirectory')),
  unlinkDirectory: () => Effect.die(new Error('Unexpected ProjectRepository.unlinkDirectory')),
}

export default ProjectRepositoryStub
