import { createFileRoute } from '@tanstack/react-router'
import * as Schema from 'effect/Schema'
import { ListTodoIcon } from 'lucide-react'
import { useState } from 'react'
import Empty from '#/components/Empty'
import FormCreateTodo from '#/components/FormCreateTodo'
import FormUpdateTodoTitle from '#/components/FormUpdateTodoTitle'
import Select from '#/components/Select'
import SkeletonTodoList from '#/components/SkeletonTodoList'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import { Item, ItemActions, ItemContent, ItemGroup, ItemSeparator } from '#/components/ui/item'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  TODO_FILTER_OPTIONS,
  TODO_STATUS_OPTIONS,
  TODO_STATUS_PRESENTATION,
  TodoFilter,
  type TTodoFilter,
} from '#/constants/todo'
import {
  useCreateTodo,
  useTodosQuery,
  useUpdateTodoStatus,
  useUpdateTodoTitle,
} from '#/store/queries/todoQueries'

export const Route = createFileRoute('/')({ component: TodoScreen })

function TodoScreen() {
  const [filter, setFilter] = useState<TTodoFilter>('ALL')
  const todosQuery = useTodosQuery()
  const createTodo = useCreateTodo()
  const updateTodoStatus = useUpdateTodoStatus()
  const updateTodoTitle = useUpdateTodoTitle()

  const todos = todosQuery.data ?? []
  const visibleTodos = filter === 'ALL' ? todos : todos.filter(todo => todo.status === filter)
  const completedTodos = todos.filter(todo => todo.status === 'COMPLETED').length

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Todos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {completedTodos} of {todos.length} tasks completed
          </p>
        </header>

        <Card>
          <CardContent className="flex flex-col gap-6">
            <FormCreateTodo
              isPending={createTodo.isPending}
              error={createTodo.error}
              onCreate={input => createTodo.mutateAsync(input)}
            />

            <Tabs
              selectedKey={filter}
              onSelectionChange={key => {
                const selectedFilter = Schema.decodeUnknownOption(TodoFilter)(key)

                if (selectedFilter._tag === 'Some') {
                  setFilter(selectedFilter.value)
                }
              }}>
              <TabsList aria-label="Filter todos">
                {TODO_FILTER_OPTIONS.map(option => (
                  <TabsTrigger key={option.value} id={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {todosQuery.isPending && <SkeletonTodoList />}

            {todosQuery.isError && (
              <Empty
                icon={<ListTodoIcon />}
                title="Could not load todos"
                description="The request failed. Try loading the list again."
                action={
                  <Button variant="outline" onPress={() => todosQuery.refetch()}>
                    Try again
                  </Button>
                }
              />
            )}

            {todosQuery.isSuccess && visibleTodos.length === 0 && (
              <Empty
                icon={<ListTodoIcon />}
                title={todos.length === 0 ? 'No todos yet' : 'No matching todos'}
                description={
                  todos.length === 0
                    ? 'Add the first todo using the form above.'
                    : 'Choose another status to see more todos.'
                }
              />
            )}

            {todosQuery.isSuccess && visibleTodos.length > 0 && (
              <ItemGroup className="gap-0">
                {visibleTodos.map((todo, index) => (
                  <div key={todo.id}>
                    {index > 0 && <ItemSeparator className="my-0" />}
                    <Item className="rounded-none px-0 py-4">
                      <ItemContent>
                        <FormUpdateTodoTitle
                          todo={todo}
                          isPending={
                            updateTodoTitle.isPending && updateTodoTitle.variables?.id === todo.id
                          }
                          error={
                            updateTodoTitle.variables?.id === todo.id ? updateTodoTitle.error : null
                          }
                          onUpdate={input => updateTodoTitle.mutateAsync(input)}
                        />
                      </ItemContent>
                      <ItemActions className="w-full justify-end sm:w-auto">
                        <Select
                          ariaLabel={`Change status for ${todo.title}`}
                          value={todo.status}
                          options={TODO_STATUS_OPTIONS}
                          isDisabled={
                            updateTodoStatus.isPending && updateTodoStatus.variables?.id === todo.id
                          }
                          variant={TODO_STATUS_PRESENTATION[todo.status].variant}
                          triggerClassName="w-32"
                          onChange={status => {
                            if (status !== todo.status) {
                              updateTodoStatus.mutate({ id: todo.id, status })
                            }
                          }}
                        />
                      </ItemActions>
                    </Item>
                  </div>
                ))}
              </ItemGroup>
            )}

            {updateTodoStatus.isError && (
              <p role="alert" className="text-destructive text-sm">
                Could not update the todo status. Try again.
              </p>
            )}
          </CardContent>

          <CardFooter className="text-muted-foreground text-sm">
            Showing {visibleTodos.length} of {todos.length} tasks
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
