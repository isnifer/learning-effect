import * as Effect from 'effect/Effect'
import ProjectRepository from '../ProjectRepository'

const ProjectRepositoryStub: ProjectRepository['Service'] = {
  create: () => Effect.die(new Error('Unexpected ProjectRepository.create')),
  getActive: () => Effect.die(new Error('Unexpected ProjectRepository.getActive')),
  archive: () => Effect.die(new Error('Unexpected ProjectRepository.archive')),
  restore: () => Effect.die(new Error('Unexpected ProjectRepository.restore')),
  linkDirectory: () => Effect.die(new Error('Unexpected ProjectRepository.linkDirectory')),
  unlinkDirectory: () => Effect.die(new Error('Unexpected ProjectRepository.unlinkDirectory')),
}

export default ProjectRepositoryStub
