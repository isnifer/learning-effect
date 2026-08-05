import ArchiveProjectProcedure from './ArchiveProjectProcedure'
import CreateProjectProcedure from './CreateProjectProcedure'
import GetActiveProjectsProcedure from './GetActiveProjectsProcedure'

const ProjectRouter = {
  create: CreateProjectProcedure,
  getActive: GetActiveProjectsProcedure,
  archive: ArchiveProjectProcedure,
}

export default ProjectRouter
