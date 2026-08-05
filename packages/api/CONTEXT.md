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
The top-level boundary for related engineering work recorded by Red Docket. Every Project-scoped
domain entity belongs to exactly one Project. A Project records when it was created as part of its
history.

**Selected Project**:
The Project currently selected in the desktop application. After Projects are loaded, Red Docket
always has a selected Project when at least one Project exists. An absent selected Project means
that the system contains no Projects. A stale selection is replaced with an existing Project and is
not exposed as an application state.
_Avoid_: Nullable selected Project, missing selected Project

**Project key**:
An immutable, human-readable identity assigned when a Project is created. A different Project key
requires a different Project.
_Avoid_: Project alias

**Project archive**:
A Project removed from active work without deleting the Project or any entity it owns. Archiving
preserves its history, keeps its Project key reserved, and makes all Project data read-only until a
human restores the Project. Agents cannot archive or restore Projects.
_Avoid_: Project deletion

**Project directory**:
An absolute local filesystem path linked to a Project for coding work. A Project may have several
Project directories, and the same path may be linked to several Projects.
_Avoid_: Directory entity, home directory

**Ticket**:
A unit of work tracked within exactly one Project. A Ticket has its own identity, title, and status
and cannot exist without its Project.
_Avoid_: Todo, Task, issue

**Ticket status**:
The current stage of a Ticket: `TODO`, `IN_PROGRESS`, or `COMPLETED`.
_Avoid_: Ticket state
