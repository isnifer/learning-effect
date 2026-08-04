# Red Docket

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
is `~/Library/Application Support/Red Docket/app.sqlite`.

Build the unpacked application or the distributable ZIP:

```bash
pnpm electron:package
pnpm electron:make
```

Forge writes both outputs to `packages/api/out`.

## Verification

```bash
pnpm --filter red-docket typecheck
pnpm --filter red-docket test
pnpm --filter red-docket build
pnpm --filter red-docket start
```

## Database schema

Generate a migration after changing the Drizzle schema:

```bash
pnpm --filter red-docket db:generate
```

## Routing

The renderer uses TanStack Router with file-based routes in `src/routes`. Regenerate the route tree
with:

```bash
pnpm --filter red-docket generate-routes
```
