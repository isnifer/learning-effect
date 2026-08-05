---
status: accepted
---

# Classify domain entities by Project scope

Red Docket contains work that belongs to a Project and application-level concepts that do not.
Treating every future entity as Project-scoped would create false ownership, while treating local
filesystem paths as entities would give identity and lifecycle to values that have neither.

## Decision

Maintain two explicit classifications for domain entities:

### Project-scoped entities

A Project-scoped entity belongs to exactly one Project and cannot exist outside that Project.

- `Ticket`

### Non-Project-scoped entities

A non-Project-scoped entity has an independent lifecycle and does not belong to a Project.

- `Project`

Classify every new domain entity into one of these lists when it is introduced.

Absolute filesystem paths are local resource values, not domain entities. A Project may be linked
to zero or more absolute paths, and the same absolute path may be linked to multiple Projects. Store
these links as pairs of `project_id` and `absolute_path`; do not introduce a `Directory` entity or a
separate `directories` table without new identity or lifecycle requirements.

## Consequences

- Project-scoped persistence records reference exactly one Project.
- Local filesystem links use a `project_directories` relation keyed by `project_id` and
  `absolute_path`.
- Archiving or restoring a Project does not add, remove, or modify its directory links.
- A future concept that has both independent identity and relationships to several Projects belongs
  in the non-Project-scoped list and may use an explicit many-to-many relation.
