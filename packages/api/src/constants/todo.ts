import * as Schema from 'effect/Schema'
import { TodoStatus, type TTodo } from '#/shared/contracts/Todo'

export const TodoFilter = Schema.Literals(['ALL', ...TodoStatus.literals])
export type TTodoFilter = typeof TodoFilter.Type

export const TODO_STATUS_PRESENTATION = {
  TODO: {
    label: 'Todo',
    badgeVariant: 'outline',
  },
  IN_PROGRESS: {
    label: 'In progress',
    badgeVariant: 'secondary',
  },
  COMPLETED: {
    label: 'Completed',
    badgeVariant: 'default',
  },
} satisfies Record<
  TTodo['status'],
  {
    label: string
    badgeVariant: 'default' | 'secondary' | 'outline'
  }
>

export const TODO_STATUS_OPTIONS = TodoStatus.literals.map(value => ({
  value,
  label: TODO_STATUS_PRESENTATION[value].label,
}))

export const TODO_FILTER_OPTIONS = [
  {
    value: 'ALL',
    label: 'All',
  },
  ...TODO_STATUS_OPTIONS,
]
