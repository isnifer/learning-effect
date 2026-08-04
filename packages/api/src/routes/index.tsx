import { createFileRoute } from '@tanstack/react-router'
import * as Schema from 'effect/Schema'
import { ListTodoIcon } from 'lucide-react'
import { useState } from 'react'
import Empty from '#/components/Empty'
import FormCreateTask from '#/components/FormCreateTask'
import FormUpdateTaskTitle from '#/components/FormUpdateTaskTitle'
import Select from '#/components/Select'
import SkeletonTaskList from '#/components/SkeletonTaskList'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import { Item, ItemActions, ItemContent, ItemGroup, ItemSeparator } from '#/components/ui/item'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  TASK_FILTER_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_PRESENTATION,
  TaskFilter,
  type TTaskFilter,
} from '#/constants/task'
import {
  useCreateTask,
  useTasksQuery,
  useUpdateTaskStatus,
  useUpdateTaskTitle,
} from '#/store/queries/taskQueries'

export const Route = createFileRoute('/')({ component: TaskScreen })

function TaskScreen() {
  const [filter, setFilter] = useState<TTaskFilter>('ALL')
  const tasksQuery = useTasksQuery()
  const createTask = useCreateTask()
  const updateTaskStatus = useUpdateTaskStatus()
  const updateTaskTitle = useUpdateTaskTitle()

  const tasks = tasksQuery.data ?? []
  const visibleTasks = filter === 'ALL' ? tasks : tasks.filter(task => task.status === filter)
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {completedTasks} of {tasks.length} tasks completed
          </p>
        </header>

        <Card>
          <CardContent className="flex flex-col gap-6">
            <FormCreateTask
              isPending={createTask.isPending}
              error={createTask.error}
              onCreate={input => createTask.mutateAsync(input)}
            />

            <Tabs
              selectedKey={filter}
              onSelectionChange={key => {
                const selectedFilter = Schema.decodeUnknownOption(TaskFilter)(key)

                if (selectedFilter._tag === 'Some') {
                  setFilter(selectedFilter.value)
                }
              }}>
              <TabsList aria-label="Filter tasks">
                {TASK_FILTER_OPTIONS.map(option => (
                  <TabsTrigger key={option.value} id={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {tasksQuery.isPending && <SkeletonTaskList />}

            {tasksQuery.isError && (
              <Empty
                icon={<ListTodoIcon />}
                title="Could not load tasks"
                description="The request failed. Try loading the list again."
                action={
                  <Button variant="outline" onPress={() => tasksQuery.refetch()}>
                    Try again
                  </Button>
                }
              />
            )}

            {tasksQuery.isSuccess && visibleTasks.length === 0 && (
              <Empty
                icon={<ListTodoIcon />}
                title={tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
                description={
                  tasks.length === 0
                    ? 'Add the first task using the form above.'
                    : 'Choose another status to see more tasks.'
                }
              />
            )}

            {tasksQuery.isSuccess && visibleTasks.length > 0 && (
              <ItemGroup className="gap-0">
                {visibleTasks.map((task, index) => (
                  <div key={task.id}>
                    {index > 0 && <ItemSeparator className="my-0" />}
                    <Item className="rounded-none px-0 py-4">
                      <ItemContent>
                        <FormUpdateTaskTitle
                          task={task}
                          isPending={
                            updateTaskTitle.isPending && updateTaskTitle.variables?.id === task.id
                          }
                          error={
                            updateTaskTitle.variables?.id === task.id ? updateTaskTitle.error : null
                          }
                          onUpdate={input => updateTaskTitle.mutateAsync(input)}
                        />
                      </ItemContent>
                      <ItemActions className="w-full justify-end sm:w-auto">
                        <Select
                          ariaLabel={`Change status for ${task.title}`}
                          value={task.status}
                          options={TASK_STATUS_OPTIONS}
                          isDisabled={
                            updateTaskStatus.isPending && updateTaskStatus.variables?.id === task.id
                          }
                          variant={TASK_STATUS_PRESENTATION[task.status].variant}
                          triggerClassName="w-32"
                          onChange={status => {
                            if (status !== task.status) {
                              updateTaskStatus.mutate({ id: task.id, status })
                            }
                          }}
                        />
                      </ItemActions>
                    </Item>
                  </div>
                ))}
              </ItemGroup>
            )}

            {updateTaskStatus.isError && (
              <p role="alert" className="text-destructive text-sm">
                Could not update the task status. Try again.
              </p>
            )}
          </CardContent>

          <CardFooter className="text-muted-foreground text-sm">
            Showing {visibleTasks.length} of {tasks.length} tasks
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
