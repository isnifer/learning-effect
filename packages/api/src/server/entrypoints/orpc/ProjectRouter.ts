import ArchiveProjectProcedure from './ArchiveProjectProcedure'
import CreateProjectProcedure from './CreateProjectProcedure'
import GetActiveProjectsProcedure from './GetActiveProjectsProcedure'
import GetArchivedProjectsProcedure from './GetArchivedProjectsProcedure'
import GetProjectDirectoriesProcedure from './GetProjectDirectoriesProcedure'
import LinkProjectDirectoryProcedure from './LinkProjectDirectoryProcedure'
import RestoreProjectProcedure from './RestoreProjectProcedure'
import UnlinkProjectDirectoryProcedure from './UnlinkProjectDirectoryProcedure'

const ProjectRouter = {
  create: CreateProjectProcedure,
  getActive: GetActiveProjectsProcedure,
  getArchived: GetArchivedProjectsProcedure,
  getDirectories: GetProjectDirectoriesProcedure,
  archive: ArchiveProjectProcedure,
  restore: RestoreProjectProcedure,
  linkDirectory: LinkProjectDirectoryProcedure,
  unlinkDirectory: UnlinkProjectDirectoryProcedure,
}

export default ProjectRouter
