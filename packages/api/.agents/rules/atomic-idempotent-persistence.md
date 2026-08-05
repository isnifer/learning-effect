# Prefer atomic idempotent persistence operations

When a persistence operation can preserve its invariants with one atomic database statement,
prefer that statement over read-before-write logic or multiple queries.

Express idempotency in the statement with database conditions or functions and return the affected
row when the repository contract needs it. Use Drizzle query-builder APIs first. Use a typed
`sql<T>` expression when Drizzle has no dedicated helper for the required database function.

Use a transaction only when the operation inherently requires multiple statements to succeed or
fail as one unit. A batch is not a replacement for transaction semantics. Do not wrap one atomic
statement in a transaction or batch without a separate transactional requirement.
