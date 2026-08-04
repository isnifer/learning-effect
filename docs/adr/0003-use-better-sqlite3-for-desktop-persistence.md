---
status: accepted
---

# Use better-sqlite3 for desktop persistence

The application must remain fully offline. It stores its data in a local SQLite file and does not
synchronize with a cloud database. A Cloudflare Worker and D1 cannot provide the required local
desktop persistence.

The installed stable Drizzle version supports `better-sqlite3` but does not yet expose a
`node:sqlite` driver. Using `node:sqlite` directly would discard the typed Drizzle query layer, while
using Turso or libSQL would add capabilities that the application explicitly does not need.

## Decision

- Use `better-sqlite3` through Drizzle for desktop persistence.
- Keep database access outside the renderer process. A desktop backend process owns the database
  connection and exposes application operations to the UI and MCP entrypoints.
- Implement desktop persistence behind the existing `TicketRepository` port.
- Use `better-sqlite3` as the only persistence adapter.
- Apply Drizzle migrations when the application runtime opens the database.
- Test the adapter explicitly against an isolated in-memory SQLite database.
- Do not add cloud synchronization.

## Consequences

- The desktop application retains the existing domain, application, oRPC, and MCP layers.
- `better-sqlite3` is a native dependency and must be rebuilt for the Electron ABI when the desktop
  application is packaged.
- Repository tests and application tests run in Node.js Vitest.
- A future stable Drizzle `node:sqlite` adapter may replace `better-sqlite3` without changing the
  repository port.
