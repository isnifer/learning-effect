# Ticket management

This context tracks Tickets. Its workflow language and process semantics follow Matt Pocock Skills.

## Language

### Process foundation

**Matt Pocock Skills**:
The canonical source for the planning processes and terminology represented by the application.
Tracker and Markdown artifacts are representations of those processes, not the domain model.
_Reference_: [mattpocock/skills](https://github.com/mattpocock/skills)

### Work

**Project**:
The top-level boundary for related engineering work recorded by Red Docket. Every other domain
entity belongs to exactly one Project. A Project records when it was created as part of its history.

**Project key**:
An immutable, human-readable identity assigned when a Project is created. A different Project key
requires a different Project.
_Avoid_: Project alias

**Project archive**:
A Project removed from active work without deleting the Project or any entity it owns. Archiving
preserves its history, keeps its Project key reserved, and makes all Project data read-only until a
human restores the Project. Agents cannot archive or restore Projects.
_Avoid_: Project deletion

**Ticket**:
A unit of work tracked within exactly one Project. A Ticket has its own identity, title, and status
and cannot exist without its Project.
_Avoid_: Todo, Task, issue

**Ticket status**:
The current stage of a Ticket: `TODO`, `IN_PROGRESS`, or `COMPLETED`.
_Avoid_: Ticket state
