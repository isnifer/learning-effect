# Make domain command semantics explicit

Define whether each domain command is strict or idempotent in its repository contract. Do not infer
successful idempotency from a persistence operation that affects no rows.

When a strict command cannot perform the requested state change, return a specific domain error.
Do not silently return success merely because the desired final state already exists. This keeps the
contract understandable without requiring consumers to read the repository implementation.

Use idempotent domain semantics only when they are an explicit product or architecture decision.
Persistence can still use one atomic statement for either strict or idempotent semantics.
