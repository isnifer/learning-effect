---
status: accepted
---

# Use semantic repositories and orchestration use cases

Use cases form the application boundary and coordinate a business scenario. They may call several repositories, combine their results, and control the order of work. Repositories expose semantic operations for their domain entities, hide persistence mechanisms, and return domain values rather than database rows. This keeps the architecture familiar to the team, preserves the dependency direction required by Clean Architecture, and leaves room for use cases to grow beyond simple delegation.

## Theoretical basis

Robert C. Martin's [Dependency Rule](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) requires source dependencies to point inward. Databases and frameworks are outer mechanisms, so D1, Drizzle, SQL defaults, and database row formats must not become contracts of the domain or application layers.

The use-case layer follows Fowler's [Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html): it defines the application's available operations and coordinates its response to each operation, including work across several resources.

The persistence seam builds on Fowler's [Repository](https://martinfowler.com/eaaCatalog/repository.html), which mediates between domain and data mapping through an interface shaped like a collection of domain objects. We deliberately allow semantic methods such as `create` when creation and persistence are one repository operation. The method's postconditions are part of the repository interface, not accidental behavior of one adapter.

Repository implementations also perform the role described by [Data Mapper](https://martinfowler.com/eaaCatalog/dataMapper.html): they translate between database rows and domain values while keeping both representations independent.

## Decision

- A use case is an application orchestration module implemented as an Effect operation.
- A repository interface belongs to the application layer and is organized around domain entities.
- A repository method may create, load, update, or remove domain entities when that operation is meaningful to its callers.
- Repository implementations belong to infrastructure. They may use Drizzle, database defaults, provider-specific SQL, and lower-level mappers internally.
- Repository implementations return values decoded by domain schemas. Drizzle models, D1 results, SQL timestamp strings, and other persistence representations do not cross the repository seam.
- Interface adapters such as oRPC receive domain results from use cases and encode or map them into transport responses.
- A separate DAO or mapper is introduced only when it hides real complexity or enables reuse. A repository implementation may call Drizzle directly.

For `CreateTask`, `TaskRepository.create` owns the postconditions that the returned entity has a UUIDv7 identifier, initial `TODO` status, a UTC creation time, and has been persisted. `CreateTask` remains the orchestration entry point and can later coordinate authorization, transactions, other repositories, or domain operations without changing the interface adapter.

## Consequences

- A simple use case may initially delegate to one repository. This is acceptable because it still defines the application operation and provides a stable place for future orchestration.
- Repository fakes make use-case unit tests deterministic, but they do not prove SQL defaults, Drizzle mapping, or D1 behavior. Each infrastructure implementation needs repository contract tests against its real persistence technology.
- Moving from D1 to PostgreSQL should primarily change migrations and infrastructure implementations. The use-case and domain contracts remain stable when the new adapter preserves the same repository semantics.
- If creation develops rules that are independent of persistence, those rules move into domain operations or the use case. They must not remain hidden inside a repository merely because creation started there.

The field-generation alternatives and D1/PostgreSQL trade-offs are documented in [Responsibility for `Task` system fields](../research/uuid-generation-responsibility.md).
