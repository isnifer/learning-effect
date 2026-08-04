# Learning Effect

Local-first ticket manager with a React renderer and a Node.js backend.

## Development

```bash
pnpm install
pnpm dev
```

The Node server listens on `http://127.0.0.1:3000` and exposes:

- the Vite React application;
- oRPC at `/api/rpc`;
- MCP Streamable HTTP at `/mcp`.

The application stores data in `data/app.sqlite`. Set `DATABASE_PATH` to use another SQLite file.
Drizzle migrations are applied automatically when the application runtime opens the database.

### Electron

Run the desktop application with Vite hot reload:

```bash
pnpm electron:dev
```

The Electron application stores data in the platform user-data directory. On macOS, the database
is `~/Library/Application Support/Learning Effect/app.sqlite`.

Build the unpacked application or the distributable ZIP:

```bash
pnpm electron:package
pnpm electron:make
```

Forge writes both outputs to `packages/api/out`.

## Verification

```bash
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api build
pnpm --filter api start
```

## Database schema

Generate a migration after changing the Drizzle schema:

```bash
pnpm --filter api db:generate
```

## Routing

The renderer uses TanStack Router with file-based routes in `src/routes`. Regenerate the route tree
with:

```bash
pnpm --filter api generate-routes
```
