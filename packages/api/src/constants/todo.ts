import * as Schema from 'effect/Schema'
import { TodoStatus, type TTodo } from '#/shared/contracts/Todo'

export const TodoFilter = Schema.Literals(['ALL', ...TodoStatus.literals])
export type TTodoFilter = typeof TodoFilter.Type

export const TODO_STATUS_PRESENTATION = {
  TODO: {
    label: 'Todo',
    variant: 'neutral',
  },
  IN_PROGRESS: {
    label: 'In progress',
    variant: 'information',
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'success',
  },
} satisfies Record<
  TTodo['status'],
  {
    label: string
    variant: 'neutral' | 'information' | 'success'
  }
>

export const TODO_STATUS_OPTIONS = TodoStatus.literals.map(value => ({
  value,
  label: TODO_STATUS_PRESENTATION[value].label,
  variant: TODO_STATUS_PRESENTATION[value].variant,
}))

export const TODO_FILTER_OPTIONS = [
  {
    value: 'ALL',
    label: 'All',
  },
  ...TODO_STATUS_OPTIONS,
] satisfies ReadonlyArray<{
  value: TTodoFilter
  label: string
}>
