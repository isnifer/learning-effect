# API package instructions

Use Effect v4 beta from `effect`. Import Schema from `effect/Schema`. Do not install
`@effect/schema`.

Place domain entities in `src/server/domain/entities` and application use cases in
`src/server/application/usecases`.

For a module with one primary export, use the same PascalCase name for the file and its default
export. Keep supporting schemas and types local until another module needs them. Export them by name
only when an external consumer appears.

Drizzle schema modules are an exception to the PascalCase default-export convention. Name each table
module after its lowercase plural database table, use a named export with the same name, and re-export
all tables from `src/server/infrastructure/persistence/d1/schema/index.ts`.

Prefix TypeScript type aliases derived from Effect schemas with `T`, such as `TTodo` and
`TCreateTodoInput`. Keep runtime schema names unprefixed. Use `Schema.brand` when values with the same
underlying TypeScript type need distinct domain identities; the `T` prefix does not provide nominal
typing.

## Package rules

- [Reuse domain literal schemas across outer layers](.agents/rules/domain-literal-schemas.md)
- [Name oRPC routers by entity and repository operation](.agents/rules/orpc-router-naming.md)
- [Prefer truthiness checks for absent values](.agents/rules/truthiness-checks.md)

## Architecture

- [Semantic repositories and orchestration use cases](../../docs/adr/0001-semantic-repositories-and-orchestration-use-cases.md)
