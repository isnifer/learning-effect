# MCP with Effect and oRPC

Status: researched on 2026-08-04.

Scope: expose the current todo application to local MCP clients through a Streamable HTTP endpoint
served by the existing Cloudflare Worker under `wrangler dev`. Remote deployment, authorization,
protocol sessions, and MCP Tasks are outside the first iteration.

## Recommendation

Add a stateless `/mcp` entrypoint to the existing Worker with the official
[`@modelcontextprotocol/server`](https://github.com/modelcontextprotocol/typescript-sdk) v2 SDK.
Register four tools:

- `todo.create`
- `todo.getAll`
- `todo.updateStatus`
- `todo.updateTitle`

The MCP entrypoint and the existing oRPC entrypoint should be peer adapters. Both should call the
same application use cases. MCP should not call an oRPC procedure inside the same process.

```text
Browser -> oRPC procedure --+
                            +-> use case -> TodoRepository -> D1 adapter -> D1
Agent   -> MCP tool --------+
```

This preserves the current dependency direction. oRPC remains the browser RPC boundary. MCP becomes
the agent boundary. The application layer remains the shared API.

## Cloudflare Code Mode and progressive discovery

Cloudflare calls the fixed-context approach **Code Mode**. Its `search and execute` pattern exposes
only two MCP tools: `search` lets model-written JavaScript inspect an OpenAPI document, and `execute`
lets model-written JavaScript call selected operations through a host-provided request function. The
complete operation catalog and intermediate results stay inside an isolated Dynamic Worker
([Cloudflare pattern guide](https://developers.cloudflare.com/agents/model-context-protocol/codemode/)).

This is a strong future fit when the application has a large operation catalog. It is not the first
implementation for this project because Cloudflare currently documents that `openApiMcpServer()`
returns an MCP SDK v1 server and must be served through `createLegacyMcpHandler`
([implementation guide](https://developers.cloudflare.com/agents/model-context-protocol/guides/build-codemode-openapi-mcp-server/)).
That conflicts with the decision to implement the current `2026-07-28` protocol through the official
MCP SDK v2.

Do not copy Cloudflare's internal Code Mode publisher or build a custom code-execution sandbox merely
to bridge that version gap. Expose the four explicit tools through SDK v2 now. Revisit
`search`/`execute` when Cloudflare's publisher supports SDK v2; replacing the MCP adapter will not
change the shared Effect use cases or repository layer.

The first iteration should run only through `wrangler dev` on loopback. It does not need OAuth,
sessions, elicitation, or the Tasks extension. The current todo operations are short synchronous
database mutations, so an ordinary `tools/call` result is the correct protocol shape.

## Why the official TypeScript SDK is the best transport adapter today

The current MCP specification is
[`2026-07-28`](https://modelcontextprotocol.io/specification/2026-07-28). The canonical specification
URL redirects to this revision, and the official TypeScript SDK states that v2 is its stable line for
this specification. The npm packages are split into `@modelcontextprotocol/server` and
`@modelcontextprotocol/client`; `@modelcontextprotocol/server@2.0.0` was the current stable server
package during this research
([SDK README](https://github.com/modelcontextprotocol/typescript-sdk#readme)).

The SDK has a fetch-native adapter designed for Cloudflare Workers. `createMcpHandler` returns a
`{ fetch }` object, creates a fresh `McpServer` per request, and requires no Node HTTP adapter
([official web-standard guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/web-standard.md)).
That maps directly to a TanStack Start server route which forwards its `Request` to the handler.

The SDK accepts tool input and output schemas through Standard Schema plus Standard JSON Schema. It
uses the schema both to validate handler values and to publish JSON Schema to MCP clients
([SDK source](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/src/server/mcp.ts)).
Effect 4 exposes both `Schema.toStandardSchemaV1` and the experimental
`Schema.toStandardJSONSchemaV1`. Before implementation, add a small type-level spike proving that a
schema enhanced by both adapters satisfies the SDK's `StandardSchemaWithJSON` constraint. If that
adapter does not compose cleanly, use the SDK's `fromJsonSchema` adapter with Effect-generated JSON
Schema and keep Effect decoding at the tool boundary.

## What Effect already provides

Effect 4 includes an MCP server under `effect/unstable/ai`:

- `McpServer.layerStdio` and `McpServer.layerHttp` provide transports.
- `Tool.make`, `Toolkit.make`, and `McpServer.toolkit` define tools and handlers through Layers.
- Tool parameter, success, and declared-failure schemas use Effect Schema.
- Resources, prompts, completion, and elicitation are also implemented.

The implementation and examples are in Effect's
[`MCP.md`](https://github.com/Effect-TS/effect/blob/b75884413b15829de2790aeae5d8087f6ffaa196/packages/effect/MCP.md)
and
[`McpServer.ts`](https://github.com/Effect-TS/effect/blob/b75884413b15829de2790aeae5d8087f6ffaa196/packages/effect/src/unstable/ai/McpServer.ts).
The `effect-mcp` server maintained by Effect contributor Tim Smart is a real example that uses this
API to serve Effect documentation
([source](https://github.com/tim-smart/effect-mcp/blob/main/src/main.ts)).

The blocker is protocol support. In the installed `effect@4.0.0-beta.103`, the only exported
protocol adapter is `McpProtocol.v2025_06_18`. The same limitation is explicit in the upstream
[`McpProtocol.ts`](https://github.com/Effect-TS/effect/blob/b75884413b15829de2790aeae5d8087f6ffaa196/packages/effect/src/unstable/ai/McpProtocol.ts).
It does not implement the current `2026-07-28` stateless protocol. The entire API is also under an
`unstable` import path.

Therefore the Effect-native MCP server is a useful learning option, but it is not the correct
transport implementation when current-spec behavior is a requirement. We can revisit it when Effect
ships a `2026-07-28` protocol adapter. The application logic will not need to change because the MCP
transport is an outer adapter.

## oRPC integration boundary

The existing router exposes the same four operations under `todo`:

- [`TodoRouter.ts`](../../packages/api/src/server/entrypoints/orpc/TodoRouter.ts)
- [`CreateTodoProcedure.ts`](../../packages/api/src/server/entrypoints/orpc/CreateTodoProcedure.ts)
- [`GetTodosProcedure.ts`](../../packages/api/src/server/entrypoints/orpc/GetTodosProcedure.ts)
- [`UpdateTodoStatusProcedure.ts`](../../packages/api/src/server/entrypoints/orpc/UpdateTodoStatusProcedure.ts)
- [`UpdateTodoTitleProcedure.ts`](../../packages/api/src/server/entrypoints/orpc/UpdateTodoTitleProcedure.ts)

No first-party MCP integration was found in the oRPC documentation or repository. A generated
oRPC-to-MCP bridge is also not desirable for this slice. oRPC procedures contain oRPC-specific error
mapping, while MCP tools need MCP tool annotations, structured content, and tool-execution error
messages. Automatically converting every procedure would expose operations to agents without an
explicit safety decision.

Reuse these elements instead:

- shared Effect schemas from [`Todo.ts`](../../packages/api/src/shared/contracts/Todo.ts);
- application use cases from `server/application/usecases`;
- `AppRuntime.runPromise` as the runtime boundary;
- typed domain and repository errors before mapping them to MCP results.

This produces two small, explicit mappings over one application core:

```text
Effect error -> ORPCError          at the oRPC adapter
Effect error -> MCP tool result    at the MCP adapter
```

For `TodoNotFoundError`, the MCP result should use `isError: true` with an actionable message that
lets the model correct the ID or refresh the list. Repository failures should return a stable generic
message and retain the original cause only in server logs. The current specification distinguishes
request/protocol errors from actionable tool-execution errors and recommends the latter for business
logic and API failures
([tool error handling](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#error-handling)).

## Tool contracts

Each successful tool should return both:

- `structuredContent` containing the encoded `Todo` or `Todos` value;
- a short text content block for clients that still rely on text.

The specification permits any JSON value in `structuredContent` and requires it to conform to the
declared `outputSchema`; clients should validate it
([structured tool output](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#structured-content)).

Suggested annotations:

| Tool                | `readOnlyHint` | `destructiveHint` | `idempotentHint` | Reason                                               |
| ------------------- | -------------- | ----------------- | ---------------- | ---------------------------------------------------- |
| `todo.getAll`       | `true`         | `false`           | `true`           | Reads state only.                                    |
| `todo.create`       | `false`        | `false`           | `false`          | Repeating it creates another todo.                   |
| `todo.updateStatus` | `false`        | `false`           | `true`           | Repeating the same target state has the same result. |
| `todo.updateTitle`  | `false`        | `false`           | `true`           | Repeating the same title has the same result.        |

Annotations are hints, not authorization controls. Clients must treat them as untrusted unless the
server is trusted
([tool definition](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#tool)).

## What changed in MCP `2026-07-28`

The new revision is materially better for this Worker deployment:

- The protocol is stateless. `initialize`, `notifications/initialized`, `Mcp-Session-Id`, and
  protocol-level sessions are removed.
- Each request carries its protocol version, client information, and capabilities in `_meta`.
- `server/discover` advertises supported versions and capabilities.
- Streamable HTTP requests include `Mcp-Method` and `Mcp-Name`, which allows routing without parsing
  the body.
- List and resource results include `ttlMs` and `cacheScope` for explicit caching.
- Tool input and output support full JSON Schema 2020-12. `structuredContent` can be any JSON value.
- Multi Round-Trip Requests replace connection-bound server-to-client requests.
- Tasks moved from the core protocol into the opt-in `io.modelcontextprotocol/tasks` extension.
- Roots, sampling, and logging are deprecated. Tools/resource URIs or server configuration, direct
  model-provider integration, and OpenTelemetry or `stderr` are their stated replacements.

The authoritative change list is the
[`2026-07-28` changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog).

The Tasks extension now uses durable handles with `tasks/get`, `tasks/update`, and `tasks/cancel`.
It is intended for long-running jobs, approval waits, external job systems, and resumable work
([Tasks overview](https://modelcontextprotocol.io/extensions/tasks/overview)). Creating or updating
one D1 row does not need it. It may become relevant later for bulk operations or workflows that wait
for human approval.

Elicitation supports form and URL modes through Multi Round-Trip Requests. Form mode must not carry
passwords, tokens, payment credentials, or other secrets; URL mode is required for sensitive flows
([elicitation specification](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)).
The first todo tools do not need elicitation because their inputs are already complete.

## Local implementation shape

1. Add exact `@modelcontextprotocol/server@2.0.0` to `packages/api`.
2. Create an MCP server factory under `server/entrypoints/mcp`.
3. Register the four tools explicitly.
4. Convert the shared Effect schemas to SDK-compatible Standard Schema plus JSON Schema values.
5. In each handler, run the existing use case with `AppRuntime.runPromise`.
6. Map typed Effect errors into MCP tool-execution errors.
7. Forward the TanStack Start `/mcp` server route to the SDK's fetch-native handler.
8. Run only through loopback `wrangler dev` in the first iteration.

The SDK creates a fresh server for every fetch request, which fits the stateless `2026-07-28`
protocol. Application state remains in D1, not in the MCP transport. No `Mcp-Session-Id`, sticky
routing, Durable Object, or in-memory session store is needed.

Even for local development, bind the dev server to loopback. The SDK's web-standard guide warns that
its bare handler does not validate `Host` or `Origin`; if the endpoint becomes reachable from a
browser or non-loopback interface, add the provided host/origin guards before the MCP handler. OAuth
and remote deployment remain a separate decision.

## Verification plan

- Unit-test each MCP tool adapter with repository test Layers through a test `ManagedRuntime`.
- Verify success and typed error mappings for create, list, status update, and title update.
- Run the official MCP Inspector against `http://127.0.0.1:<port>/mcp` and call all four tools.
- Verify that `tools/list` exposes deterministic tool order, input/output schemas, and annotations.
- Verify that invalid schema input never reaches a use case.
- Verify that a tool-created todo appears in the browser and that browser changes are visible through
  `todo.getAll`.

The official TypeScript SDK guide uses MCP Inspector for manual server verification
([first-server guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/get-started/first-server.md)).
The official MCP conformance suite can be added after the initial slice
([conformance repository](https://github.com/modelcontextprotocol/conformance)).

## Decision summary

Use the official MCP TypeScript SDK v2 for the current protocol and Cloudflare-compatible transport.
Use Effect for schemas, use cases, typed errors, dependency injection, and runtime execution. Keep
oRPC and MCP as separate entrypoint adapters over the same application layer. Start with a local,
stateless `/mcp` endpoint and four synchronous todo tools. Reconsider Effect's native MCP server when
it supports `2026-07-28`.
