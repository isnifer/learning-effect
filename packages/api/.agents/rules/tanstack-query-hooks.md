# Organize TanStack Query hooks

Keep oRPC-backed TanStack Query hooks in the flat `src/store/queries` directory.

Create one module per singular entity namespace. Name it `<entity>Queries.ts`, such as
`todoQueries.ts`, to match the project's singular oRPC namespace convention.

The query module must own `useQuery` and `useMutation` setup, oRPC query and mutation options,
query keys, cache updates, and invalidation.

Screens and components must import ready domain hooks, such as `useTodosQuery`, `useCreateTodo`, and
`useUpdateTodoStatus`. They must not assemble these domain queries and mutations inline.

Keep local presentation state and route-specific hooks in the screen when they do not belong to
server state.
