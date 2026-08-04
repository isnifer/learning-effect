# Development workflow

Use `pnpm dev` as the canonical development mode. It runs the complete Electron application with
the Node server, oRPC, MCP, SQLite, and the Vite renderer. Use `pnpm dev:web` only as an auxiliary
browser environment for fast UI and browser-tool iteration. Do not run both modes at the same time:
they both use port `3000` and store data in different SQLite files. Verify completed slices in
Electron before considering them done.
