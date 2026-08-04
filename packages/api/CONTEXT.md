# Task management

This context organizes the User's personal Projects and tracks work performed by the User and
delegated Agents.

## Language

### Work

**Task**:
A unit of work tracked by the application. A Task belongs to a Project and has its own identity,
project-local number, title, and status.
_Avoid_: Todo, issue

**Task status**:
The current stage of a Task: `TODO`, `IN_PROGRESS`, or `COMPLETED`.
_Avoid_: Task state

**Project**:
A collection of related Tasks owned by the User. A Project provides the key used by its Tasks for
project-local identifiers.
_Avoid_: Workspace

### Participants

**User**:
The authenticated human who owns the personal system and can delegate work to Agents.
_Avoid_: Account

**Actor**:
An identity responsible for an action in the system. A User and an Agent are both Actors.
_Avoid_: Author, principal

**Agent**:
A Task-scoped Actor that receives delegated authority from another Actor. Its identity remains in
the Task history after the active Agent process ends.
_Avoid_: Bot, Agent user

**Delegation**:
Authority granted by one Actor to an Agent to work on a specific Task. An Agent can delegate work to
another Agent.
_Avoid_: Agent assignment

### History

**Task activity**:
A historical record of a Task change attributed to the Actor responsible for it.
_Avoid_: Audit log

**Task comment**:
A message written by an Actor on a Task and preserved in its history.
_Avoid_: Note
