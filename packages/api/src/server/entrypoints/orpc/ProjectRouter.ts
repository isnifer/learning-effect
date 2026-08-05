import ArchiveProjectProcedure from './ArchiveProjectProcedure'
import CreateProjectProcedure from './CreateProjectProcedure'
import GetActiveProjectsProcedure from './GetActiveProjectsProcedure'
import RestoreProjectProcedure from './RestoreProjectProcedure'

const ProjectRouter = {
  create: CreateProjectProcedure,
  getActive: GetActiveProjectsProcedure,
  archive: ArchiveProjectProcedure,
  restore: RestoreProjectProcedure,
}

export default ProjectRouter
