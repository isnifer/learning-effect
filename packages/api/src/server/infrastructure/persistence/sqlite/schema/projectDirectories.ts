import { index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { projects } from './projects'

export const projectDirectories = sqliteTable(
  'project_directories',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    absolutePath: text('absolute_path').notNull(),
  },
  table => [
    primaryKey({ columns: [table.projectId, table.absolutePath] }),
    index('project_directories_absolute_path_index').on(table.absolutePath),
  ]
)
