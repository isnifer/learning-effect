# Responsibility for `Task` system fields

Status: researched on 2026-08-03.

Scope: `id` as UUIDv7, initial `status = TODO`, and `createdAt` as a UTC instant in an Effect-native Clean Architecture application. The current persistence target is Cloudflare D1 through Drizzle. A possible future target is PlanetScale Postgres.

## Short answer

The possible future move to Postgres should not force the application to use only features shared by D1 and Postgres today.

The stable inner contract should describe semantics. The outer adapter can use a provider-specific mechanism to satisfy those semantics. This follows Robert C. Martin's Dependency Rule: source dependencies point inward, outer data formats do not enter inner layers, and a database is an outer detail ([The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)).

For this project, the strongest default design is:

- Domain owns the rule that a new `Task` starts in `TODO`.
- Application obtains a UUIDv7 from an `IdGenerator` port.
- Application obtains the creation instant from Effect's `Clock` service.
- Application gives a complete domain `Task` to `TaskRepository.insert` or `save`.
- The repository adapter maps the domain entity to D1 or Postgres rows.
- The database enforces storage constraints. Database defaults can exist as defense in depth, but the application does not rely on them for domain semantics.

This recommendation maximizes explicit behavior, deterministic tests, and migration portability. It is not the only Clean Architecture-compliant option.

## What Clean Architecture actually requires

Martin distinguishes inner policy from outer mechanisms. Entities contain enterprise rules. Use cases contain application-specific rules. Databases and frameworks are outer mechanisms. His Dependency Rule says inner source code must not name outer elements. He also says that database row formats should not cross inward; boundary data must use a form convenient for the inner layer ([primary source](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)).

This gives two important conclusions:

1. Clean Architecture does not require all generated fields to be produced in one prescribed layer.
2. It requires the inner layers to depend on a semantic interface, not on `D1`, Drizzle's `$defaultFn`, `CURRENT_TIMESTAMP`, or PostgreSQL's `uuidv7()`.

Therefore both of these ports can respect the Dependency Rule:

```ts
TaskRepository.insert(task: TTask): Effect<TTask, TaskRepositoryError>
```

```ts
TaskRepository.create(input: TCreateTaskInput): Effect<TTask, TaskRepositoryError>
```

The difference is ownership. With `insert`, domain/application code creates the entity. With `create`, the repository contract also owns the guarantee that it will return a new valid entity. Every adapter and test implementation must reproduce that guarantee.

## Responsibilities by layer

### Domain

The domain defines what a valid `Task` is and which rules are true when it is created.

It should own:

- the branded UUIDv7 identity type and its validation;
- the allowed status values;
- the rule that a newly created `Task` starts in `TODO`;
- a pure constructor or function that creates a `Task` from already supplied system values.

It should not read a clock, call a UUID library, import Drizzle, or execute SQL. Those actions are mechanisms.

The domain can set `status: "TODO"` itself while accepting `id`, `title`, and `createdAt` as arguments. This keeps the business rule visible without making the domain perform side effects.

### Application use case

The application layer orchestrates the creation workflow.

It can:

- accept the decoded `CreateTaskInput`;
- request a UUIDv7 through an application-owned port;
- read the current time through Effect's `Clock`;
- call the domain constructor;
- persist the complete entity through `TaskRepository`.

Effect already models wall-clock time as a service. `Clock.currentTimeMillis` reads from the active `Clock`, and the official source shows that another `Clock` can be provided for a deterministic program ([Effect `Clock.ts` at the vendored commit](https://github.com/Effect-TS/effect/blob/b75884413b15829de2790aeae5d8087f6ffaa196/packages/effect/src/Clock.ts#L240-L265)). A UUIDv7 generator can follow the same service-and-layer model.

### Repository port

The repository port is an inner interface. Its implementation is external.

The port should describe semantics and typed failures. It should not expose:

- Drizzle insert models;
- D1 result objects;
- SQLite timestamp strings;
- PostgreSQL `uuid` or `timestamptz` driver values.

If the port is `create(input)`, its contract must explicitly guarantee all of the following:

- returned `id` is UUIDv7;
- returned initial status is `TODO`;
- returned `createdAt` is a UTC instant;
- the returned entity was persisted.

Without that contract, these rules become accidental behavior of one adapter.

### Repository adapter

The adapter converts between domain data and persistence data.

It can legitimately use:

- Drizzle `$defaultFn` in the Worker;
- a D1 SQL default;
- PostgreSQL `uuidv7()`;
- PostgreSQL `timestamptz`;
- provider-specific `RETURNING` behavior.

The adapter must decode the returned row into the domain schema. For D1, this includes converting SQLite timestamp text into `DateTime.Utc`. The current Effect source distinguishes `Schema.DateTimeUtc`, which validates an existing `DateTime.Utc`, from `Schema.DateTimeUtcFromString`, which decodes a string and treats a string without a zone as UTC ([Effect `Schema.ts`](https://github.com/Effect-TS/effect/blob/b75884413b15829de2790aeae5d8087f6ffaa196/packages/effect/src/Schema.ts#L13476-L13516)).

### Database

The database owns persistence integrity and database-native concerns.

Good database responsibilities include:

- `PRIMARY KEY`, `NOT NULL`, and `UNIQUE`;
- a `CHECK` constraint for the set of valid status values;
- a storage representation for instants;
- optional defaults that protect writes made outside the main application.

A default is not a complete domain invariant. A `status DEFAULT 'TODO'` applies only when an insert omits the column. A caller can still explicitly insert `IN_PROGRESS` unless an additional mechanism prevents it. A status-membership `CHECK` only proves that the value is allowed; it does not prove that a new entity started in `TODO`.

## Placement options

### Option A: application creates the complete entity

Flow:

```text
CreateTaskInput
  -> UUIDv7 service + Effect Clock
  -> domain constructor sets TODO
  -> TaskRepository.insert(TTask)
  -> TTask
```

Advantages:

- The use case exposes every system decision.
- The domain rule for initial status is visible in domain code.
- Unit tests can provide fixed time and fixed ID.
- D1 and Postgres adapters receive the same complete entity.
- The application knows the ID before persistence. This helps correlation, child records, and domain events.
- A database move changes the adapter and migrations, not creation semantics.

Disadvantages:

- All writers must use the application path or reproduce the rules.
- Application and database clocks can disagree if database-side audit timestamps also exist.
- The UUIDv7 generator becomes an application dependency that needs a production layer and tests.
- A retry strategy must preserve or intentionally regenerate the ID.

Best fit:

- `createdAt` means when the domain entity was created.
- The application is the authoritative writer.
- Portability and deterministic tests are important.

### Option B: repository adapter creates system fields

Flow:

```text
CreateTaskInput
  -> TaskRepository.create(input)
  -> adapter generates or requests defaults
  -> adapter returns decoded TTask
```

Advantages:

- The use case stays small.
- Persistence-related generation is encapsulated behind the port.
- Each adapter can use the strongest capability of its target.
- The inner layer still does not depend on D1 or Postgres if the port is application-owned.

Disadvantages:

- The repository now combines persistence and entity creation.
- Domain rules are less visible.
- Every adapter, in-memory implementation, and test double must reproduce UUIDv7, UTC, and `TODO` semantics.
- A one-line use case can become a pass-through with no present policy of its own.
- A future adapter change can silently change creation behavior unless contract tests cover the port.

Best fit:

- The operation is intentionally persistence-centric CRUD.
- The team accepts a semantic `create` repository operation.
- Adapter contract tests verify the complete returned entity.

This is still compatible with Clean Architecture. It is less explicit than Option A.

### Option C: database generates system fields

Flow:

```text
INSERT title only
  -> database defaults id, status, createdAt
  -> INSERT ... RETURNING
  -> adapter decodes TTask
```

Advantages:

- Every writer that omits the fields receives the same defaults.
- Generation and persistence happen in one database operation.
- Database time is consistent for rows written in the same database context.
- The application does not need to generate values before insertion.

Disadvantages:

- Capability and semantics differ by database and database version.
- Tests need the real database, or a faithful substitute, to verify defaults.
- The entity ID is unavailable until the insert returns.
- `createdAt` becomes persistence time, not necessarily domain creation time.
- A default does not stop a caller from explicitly supplying another value.
- Migration must preserve both data representation and generation behavior.

Best fit:

- The database is the authoritative integration point for multiple writers.
- The intended timestamp means row insertion time.
- Provider-specific adapter behavior is acceptable and integration-tested.

## Field-by-field recommendation

### `status`

`TODO` is a business rule, not a storage mechanism.

Recommended owner: domain constructor.

A database `DEFAULT 'TODO'`, `NOT NULL`, and status `CHECK` can remain as defense in depth. The use case must not depend on the default to establish the domain rule.

### `createdAt`

First define its meaning:

- If it means “the domain `Task` came into existence”, obtain it in the application and pass it to the domain constructor.
- If it means “this row was inserted into this database”, generate it in the database. Consider naming it `persistedAt` if both concepts may later exist.

For the current `Task`, “entity creation instant” is the more useful interpretation. Recommended owner: application through Effect `Clock`.

If D1 generates it, SQLite specifies that `CURRENT_TIMESTAMP` is UTC text in `YYYY-MM-DD HH:MM:SS` format. It has second precision and no explicit `Z` suffix ([SQLite `CREATE TABLE`](https://www.sqlite.org/lang_createtable.html#the_default_clause)). The adapter must make the UTC assumption explicit when decoding.

If Postgres generates it, use `timestamptz`, not bare `timestamp`. PostgreSQL stores `timestamptz` internally as UTC and converts it for display according to the session timezone ([PostgreSQL date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html)). Also note that PostgreSQL `CURRENT_TIMESTAMP` represents the transaction start time, which can differ from statement time in a long transaction ([PostgreSQL date/time functions](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT)).

### `id`

The requirement that an ID is UUIDv7 belongs to the domain contract. The mechanism that generates it is replaceable.

Recommended owner of the mechanism: an application-facing `TaskIdGenerator` service with an outer production layer.

This makes the application portable and testable. The concrete generator can run in the Worker today. A future design can replace it without changing the domain type.

If the repository adapter owns generation, Drizzle `$defaultFn(() => uuidv7())` is a Worker/runtime default, not a D1 default. Drizzle states that `$defaultFn` affects `drizzle-orm` runtime insert queries and does not affect `drizzle-kit` schema generation ([Drizzle SQLite column types](https://orm.drizzle.team/docs/sqlite/column-types#default-value)). Direct SQL writes to D1 do not receive that value.

No reviewed D1 or SQLite documentation provides a built-in UUIDv7 function. D1 documents SQLite semantics and a limited set of supported extensions ([D1 SQL statements](https://developers.cloudflare.com/d1/sql-api/sql-statements/)). Therefore a D1 database-native UUIDv7 default would require custom SQL construction whose correctness and availability must be verified separately. It is not a recommended baseline.

## Current PlanetScale Postgres status

PlanetScale for Postgres has been generally available since 2025-09-22 ([PlanetScale changelog](https://planetscale.com/changelog/postgres-ga)).

As of this research date, PlanetScale supports PostgreSQL 17.9 and 18.3. New databases use the latest version by default. PlanetScale does not currently provide in-place major upgrades from 17 to 18; that move requires a new Postgres 18 database and an online migration ([supported versions](https://planetscale.com/docs/postgres/cluster-configuration/versions)).

PostgreSQL 18 provides the native `uuidv7()` function. PostgreSQL documents it as a time-ordered UUIDv7 with millisecond timestamp, sub-millisecond timestamp, and random components ([PostgreSQL UUID functions](https://www.postgresql.org/docs/current/functions-uuid.html)). PlanetScale's version page also lists `uuidv7()` as a PostgreSQL 18 feature.

Consequences:

- A future PlanetScale Postgres 18 adapter can use `id uuid DEFAULT uuidv7()`.
- A PlanetScale Postgres 17 design cannot assume the PostgreSQL 18 core function.
- If UUID generation stays in the application, the database version does not change ID generation behavior.
- If starting a new PlanetScale database specifically to use native UUIDv7, choose Postgres 18. This is a future deployment choice, not a restriction that D1 code must imitate now.

## D1 to PlanetScale migration consequences

| Concern              | D1 / SQLite                                                                                      | PlanetScale Postgres 18                                           | Migration consequence                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| UUID storage         | Usually `TEXT`                                                                                   | Native `uuid`                                                     | Validate and cast every existing value. The domain UUIDv7 schema provides an application-side check.         |
| UUID generation      | Worker library or Drizzle runtime `$defaultFn`; no reviewed built-in UUIDv7 function             | Native `uuidv7()` is available                                    | Application generation avoids behavior change. Database generation requires a new default and adapter tests. |
| `createdAt` storage  | `TEXT`, integer epoch, or real Julian day; `CURRENT_TIMESTAMP` text is UTC with second precision | `timestamptz`, microsecond resolution                             | Convert with an explicit UTC assumption. Decide whether historical second precision is acceptable.           |
| Current-time default | SQLite `CURRENT_TIMESTAMP` is UTC text                                                           | PostgreSQL `CURRENT_TIMESTAMP` is transaction-start `timestamptz` | The names look portable but exact semantics and representations differ.                                      |
| Initial status       | Text default and `CHECK`                                                                         | Text/enum default and constraint                                  | Preserve the domain rule independently. Treat SQL default syntax as adapter migration detail.                |
| Returned row         | D1/Drizzle representation                                                                        | PostgreSQL driver/Drizzle representation                          | Keep both representations outside the repository port and decode into the same domain entity.                |

The migration cost is primarily in schema migration and adapter mapping. It does not need to leak into the domain or use case if the inner contracts use `TaskId`, `TaskStatus`, and `DateTime.Utc` rather than database types.

## Recommended design for this repository

Use this responsibility split:

```text
domain/entities/Task
  validates Task
  creates a new Task with status TODO
  accepts id and createdAt as already supplied values

application/usecases/CreateTask
  accepts TCreateTaskInput
  obtains TaskIdGenerator
  obtains Effect Clock
  calls the domain constructor
  calls TaskRepository.insert(task)

application ports
  TaskIdGenerator: generate -> Effect<TTaskId, ...>
  TaskRepository: insert(TTask) -> Effect<TTask, ...>

infrastructure adapter
  implements TaskIdGenerator with a Worker-compatible UUIDv7 library
  maps TTask to Drizzle/D1
  decodes returned rows into TTask

database
  PRIMARY KEY, NOT NULL, UNIQUE, status CHECK
  optional defaults only as defense in depth
```

This design does not require premature abstraction around Postgres. The two ports are already justified by current behavior: ID generation is replaceable, and persistence is external.

If the preferred API remains `TaskRepository.create(input)`, document it as a semantic port and use contract tests against every adapter. That approach is valid, but it deliberately assigns entity construction to the repository abstraction. Do not describe it as “the database creates the entity” when UUIDv7 comes from Drizzle `$defaultFn`; that function runs in the application runtime.

## Decision guide

Choose application generation when:

- `createdAt` is domain creation time;
- deterministic unit tests matter;
- the application is the main writer;
- migration portability matters.

Choose database generation when:

- several independent writers insert directly;
- `createdAt` is row insertion time;
- database integration tests are part of the normal workflow;
- the chosen database version has the required native function.

Choose repository-adapter generation when:

- a thin CRUD use case is an explicit design goal;
- the port precisely guarantees the completed entity;
- duplicated semantics across adapters are protected by contract tests.

For the current project, use application generation plus domain-owned initial status. Add database constraints for storage safety. Reconsider database generation only when a real multi-writer or database-time requirement appears.
