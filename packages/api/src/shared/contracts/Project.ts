import * as Schema from 'effect/Schema'
import * as Struct from 'effect/Struct'
import {
  posixAbsoluteProjectDirectoryPathPattern,
  windowsDriveAbsoluteProjectDirectoryPathPattern,
  windowsUncAbsoluteProjectDirectoryPathPattern,
} from '#/utils/projectDirectoryPathPatterns'

const absoluteProjectDirectoryPathPatterns = [
  posixAbsoluteProjectDirectoryPathPattern,
  windowsDriveAbsoluteProjectDirectoryPathPattern,
  windowsUncAbsoluteProjectDirectoryPathPattern,
] as const

export const ProjectId = Schema.String.pipe(
  Schema.check(Schema.isUUID(7)),
  Schema.brand('ProjectId')
)

export const ProjectName = Schema.Trim.pipe(
  Schema.check(Schema.isNonEmpty()),
  Schema.brand('ProjectName')
)

export const ProjectKey = Schema.Trim.pipe(
  Schema.check(Schema.isPattern(/^[A-Z][A-Z0-9]*$/)),
  Schema.brand('ProjectKey')
)

export const ProjectDirectoryPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter(absolutePath =>
      !absolutePath.includes('\0') &&
      absoluteProjectDirectoryPathPatterns.some(pattern => pattern.test(absolutePath))
        ? undefined
        : 'Expected an absolute Project directory path'
    )
  ),
  Schema.brand('ProjectDirectoryPath')
)
export type TProjectDirectoryPath = typeof ProjectDirectoryPath.Type

const ProjectTimestamp = Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0)))

const Project = Schema.Struct({
  id: ProjectId,
  name: ProjectName,
  key: ProjectKey,
  createdAt: ProjectTimestamp,
  archivedAt: Schema.NullOr(ProjectTimestamp),
})
export type TProject = typeof Project.Type

export const CreateProjectInput = Project.mapFields(Struct.pick(['name', 'key']))
export type TCreateProjectInput = typeof CreateProjectInput.Type

export const ArchiveProjectInput = Project.mapFields(Struct.pick(['id']))
export type TArchiveProjectInput = typeof ArchiveProjectInput.Type

export const RestoreProjectInput = Project.mapFields(Struct.pick(['id']))
export type TRestoreProjectInput = typeof RestoreProjectInput.Type

export const LinkProjectDirectoryInput = Schema.Struct({
  projectId: ProjectId,
  absolutePath: ProjectDirectoryPath,
})
export type TLinkProjectDirectoryInput = typeof LinkProjectDirectoryInput.Type

export const UnlinkProjectDirectoryInput = LinkProjectDirectoryInput
export type TUnlinkProjectDirectoryInput = typeof UnlinkProjectDirectoryInput.Type

export const Projects = Schema.Array(Project)

export default Project
