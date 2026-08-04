# Name tests by subject, context, and behavior

Use each test label for one purpose:

- `describe` names the module under test with its exact module name, such as `CreateTask` or
  `D1TaskRepository`. Do not include its directory path.
- `layer` names the dependency context. When a suite covers success and error directions, name
  every Layer group symmetrically, such as `when the repository succeeds` and
  `when the repository fails`. Do not leave the success group unnamed while naming only the error
  group.
- `it.effect` starts with the tested operation followed by a colon when the behavior belongs to a
  named repository method or public operation. After the prefix, state one observable behavior as
  a present-tense verb phrase without `should`, such as `create: returns the created Task` or
  `create: preserves TaskRepositoryError`.

Do not repeat the module name in both `describe` and `layer`. Use outcome contexts instead of
generic labels such as `works`, `happy path`, or `test CreateTask`. Do not add another `describe`
only to separate success and error directions; a named `layer(...)` already creates that suite.

```ts
describe('CreateTask', () => {
  layer(SucceedingTaskRepository)('when the repository succeeds', it => {
    it.effect('create: creates a Task through the repository', () => effect)
  })

  layer(FailingTaskRepository)('when the repository fails', it => {
    it.effect('create: preserves TaskRepositoryError', () => effect)
  })
})
```
