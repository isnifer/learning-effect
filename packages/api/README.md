# Red Docket

Local-first ticket manager with a React renderer and a Node.js backend.

## Development

```bash
pnpm install
pnpm dev
```

This starts the Electron application with Vite hot reload. The Electron main process starts a Node
server on `http://127.0.0.1:3000` that exposes:

- the Vite React application;
- oRPC at `/api/rpc`;
- MCP Streamable HTTP at `/mcp`.

The Electron application stores data in the platform user-data directory. On macOS, the database
is `~/Library/Application Support/Red Docket/app.sqlite`. Drizzle migrations are applied
automatically when the application runtime opens the database.

### Browser development

Run the application in a browser without Electron:

```bash
pnpm dev:web
```

The browser development server uses `data/app.sqlite`. Set `DATABASE_PATH` to use another SQLite
file. Do not run browser and Electron development at the same time because both servers use port
`3000`.

### Packaging

Build the unpacked application or the distributable ZIP:

```bash
pnpm package
pnpm make
```

Forge writes both outputs to `packages/api/out`.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm verify
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
