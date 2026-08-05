# API package instructions

Use Effect v4 beta from `effect`. Import Schema from `effect/Schema`. Do not install
`@effect/schema`.

Place domain entities in `src/server/domain/entities` and application use cases in
`src/server/application/usecases`.

For a module with one primary export, use the same PascalCase name for the file and its default
export. Keep supporting schemas and types local until another module needs them. Export them by name
only when an external consumer appears.

Drizzle SQLite schema modules are an exception to the PascalCase default-export convention. Name each
table module after its lowercase plural database table, use a named export with the same name, and
re-export all tables from `src/server/infrastructure/persistence/sqlite/schema/index.ts`.

Prefix TypeScript type aliases derived from Effect schemas with `T`, such as `TTicket` and
`TCreateTicketInput`. Keep runtime schema names unprefixed. Use `Schema.brand` when values with the same
underlying TypeScript type need distinct domain identities; the `T` prefix does not provide nominal
typing.

## Package rules

- [Prefer atomic idempotent persistence operations](.agents/rules/atomic-idempotent-persistence.md)
- [Make domain command semantics explicit](.agents/rules/explicit-domain-command-semantics.md)
- [Organize application components](.agents/rules/components.md)
- [Reuse domain literal schemas across outer layers](.agents/rules/domain-literal-schemas.md)
- [Name oRPC routers by entity and repository operation](.agents/rules/orpc-router-naming.md)
- [Place each schema-derived type next to its schema](.agents/rules/schema-derived-type-placement.md)
- [Organize TanStack Query hooks](.agents/rules/tanstack-query-hooks.md)
- [Prefer truthiness checks for absent values](.agents/rules/truthiness-checks.md)
- [Prefer shadcn components](.agents/rules/shadcn/component-selection.md)

## Architecture

- [Semantic repositories and orchestration use cases](../../docs/adr/0001-semantic-repositories-and-orchestration-use-cases.md)
- [Order tickets by workflow group and UUIDv7](../../docs/adr/0002-order-tickets-by-workflow-group-and-uuidv7.md)
- [Use better-sqlite3 for desktop persistence](../../docs/adr/0003-use-better-sqlite3-for-desktop-persistence.md)
- [Classify domain entities by Project scope](../../docs/adr/0004-classify-domain-entities-by-project-scope.md)
