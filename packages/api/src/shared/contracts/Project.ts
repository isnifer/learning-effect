import * as Schema from 'effect/Schema'
import * as Struct from 'effect/Struct'

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

export default Project
