---
status: accepted
---

# Order todos by workflow group and UUIDv7

The todo list represents workflow priority before creation recency. Active work must remain visible
at the top, pending work follows it, and completed work stays at the end of the list.

## Decision

Assign every todo status to an ordered workflow group:

1. Active statuses, such as `IN_PROGRESS` and a future `IN_REVIEW` status.
2. Pending statuses, such as `TODO` and future backlog-like statuses.
3. Completed statuses, such as `COMPLETED`.

Sort todos first by the workflow group and then by `id DESC` within that group.

Todo identifiers are UUIDv7 values. Their canonical string representation starts with the embedded
timestamp, so descending lexicographical order places newer identifiers before older identifiers.
`createdAt` does not participate in list ordering.

The status-to-group mapping must be exhaustive against the domain `TodoStatus` type. Adding a new
status must produce a TypeScript error until that status is assigned to a workflow group.

The D1 adapter implements this order with fixed status-group predicates composed through Drizzle,
followed by descending UUIDv7 order.

## Consequences

- Changing a todo to an active status moves it into the top group.
- Changing a todo to a completed status moves it into the final group.
- A status change does not make a todo newer. Its position within the destination group still follows
  its UUIDv7 creation time.
- A newly created `TODO` appears before older pending todos but after every active todo.
- A newly completed todo appears before older completed todos but after every active and pending todo.
- The frontend consumes repository order and does not reproduce the workflow-group sorting rule.
- `id` is the table primary key. If the status-priority expression becomes expensive at scale, the
  persistence adapter may introduce an indexed derived priority without changing repository
  semantics.
