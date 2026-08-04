import * as Schema from 'effect/Schema'
import { TaskStatus, type TTask } from '#/shared/contracts/Task'

export const TaskFilter = Schema.Literals(['ALL', ...TaskStatus.literals])
export type TTaskFilter = typeof TaskFilter.Type

export const TASK_STATUS_PRESENTATION = {
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
  TTask['status'],
  {
    label: string
    variant: 'neutral' | 'information' | 'success'
  }
>

export const TASK_STATUS_OPTIONS = TaskStatus.literals.map(value => ({
  value,
  label: TASK_STATUS_PRESENTATION[value].label,
  variant: TASK_STATUS_PRESENTATION[value].variant,
}))

export const TASK_FILTER_OPTIONS = [
  {
    value: 'ALL',
    label: 'All',
  },
  ...TASK_STATUS_OPTIONS,
] satisfies ReadonlyArray<{
  value: TTaskFilter
  label: string
}>
