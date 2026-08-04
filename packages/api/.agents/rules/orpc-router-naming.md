# Name oRPC routers by entity and repository operation

Group oRPC procedures under a singular entity namespace, such as `task`.

When a procedure has the same semantics as a repository method, use the repository method name as
the procedure key, such as `task.create` or `task.getAll`. Use a different verb only when the
procedure represents a distinct application operation.

Keep each entity router in its own PascalCase module, such as `TaskRouter.ts`, and compose entity
routers in the root oRPC router.
