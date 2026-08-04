# Name tests by subject, context, and behavior

Use each test label for one purpose:

- `describe` names the module under test with its exact module name, such as `CreateTodo` or
  `D1TodoRepository`. Do not include its directory path.
- `layer` is unnamed when it only provides the default test dependencies. When multiple layers
  represent distinct scenarios, name each group as a context that starts with `when` or `with`,
  such as `when the repository fails`.
- `it.effect` states one observable behavior as a present-tense verb phrase without `should`, such
  as `returns the created Todo` or `fails with TodoRepositoryError`.

Do not repeat the module name in both `describe` and `layer`. Avoid generic labels such as
`works`, `happy path`, or `test CreateTodo`.

```ts
describe('CreateTodo', () => {
  layer(TestTodoRepository)(it => {
    it.effect('delegates creation to the repository', () => effect)
  })

  layer(FailingTodoRepository)('when the repository fails', it => {
    it.effect('preserves TodoRepositoryError', () => effect)
  })
})
```
