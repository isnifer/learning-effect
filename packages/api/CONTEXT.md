# Ticket management

This context tracks Tickets. Its workflow language and process semantics follow Matt Pocock Skills.

## Language

### Process foundation

**Matt Pocock Skills**:
The canonical source for the planning processes and terminology represented by the application.
Tracker and Markdown artifacts are representations of those processes, not the domain model.
_Reference_: [mattpocock/skills](https://github.com/mattpocock/skills)

### Work

**Ticket**:
A unit of work tracked by the application. A Ticket has its own identity, title, and status.
_Avoid_: Todo, Task, issue

**Ticket status**:
The current stage of a Ticket: `TODO`, `IN_PROGRESS`, or `COMPLETED`.
_Avoid_: Ticket state
