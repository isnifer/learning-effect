# Effect TypeScript-Go adoption

Research date: 2026-08-05

## Decision

Adopt `@effect/tsgo` as the TypeScript 7 integration for Effect diagnostics. Replace
`@effect/language-service`; do not run both integrations in parallel.

Start with the TypeScript integration, then add the Effect Oxlint patch as a separate controlled
integration slice.

## Why this repository needs it

The workspace currently combines:

- `typescript@7.0.2` in `packages/api/package.json`;
- `@effect/language-service@0.87.1` in the root `package.json`;
- the `@effect/language-service` plugin entry in `packages/api/tsconfig.json`.

The installed `effect-language-service check` and `effect-language-service diagnostics` commands
reject TypeScript 7 and instruct TypeScript 7 users to use `@effect/tsgo`. The old package README
also describes `@effect/tsgo` as the TypeScript 7 path
([source](https://github.com/Effect-TS/language-service/blob/f26d5835d6e3d943368c141417374db00f246e9e/README.md#L1-L6)).

The current `pnpm typecheck` and `pnpm exec oxlint .` commands pass, but this does not verify Effect
diagnostics. The installed Effect language-service CLI fails before it can analyze the project.

`@effect/tsgo@0.31.0` supports the exact installed native TypeScript version, `7.0.2`
([upstream profile](https://github.com/Effect-TS/tsgo/blob/9eda97ef918dba182a45c7f4c9ebb8dcda899971/_packages/tsgo/upstream.json#L13-L20)).
The plugin name in `tsconfig.json` remains `@effect/language-service`; the npm package and native
language-server implementation change.

## What `@effect/tsgo` provides

Effect TypeScript-Go is a patched superset of official TypeScript-Go. It adds Effect-specific
diagnostics, quick fixes, refactors, completions, hover information, rename support, and other
language-server features. The project explicitly says to use Effect TypeScript-Go instead of the
official TypeScript-Go server, not beside it
([source](https://github.com/Effect-TS/tsgo/blob/9eda97ef918dba182a45c7f4c9ebb8dcda899971/README.md#L189-L204)).

The diagnostics include correctness checks that ordinary TypeScript and syntax-oriented Oxlint
rules do not provide. Examples include floating Effect values, unhandled Effect errors or service
requirements, missing Layer requirements, Promise values in Effect success channels, unsafe Effect
type assertions, and Effect-specific resource or error-handling mistakes
([diagnostic catalog](https://github.com/Effect-TS/tsgo/blob/9eda97ef918dba182a45c7f4c9ebb8dcda899971/README.md#L35-L145)).

The linter has three supported execution paths
([source](https://github.com/Effect-TS/tsgo/blob/9eda97ef918dba182a45c7f4c9ebb8dcda899971/README.md#L23-L33)):

1. Patch `tsc`, so the existing typecheck emits Effect diagnostics without a second typecheck.
2. Run `effect-tsgo diagnostics --project <tsconfig>`, which performs a separate typecheck and can
   emit structured output.
3. Patch Oxlint and enable the `effecttsgo` type-aware plugin.

## Recommended rollout

1. Replace root `@effect/language-service@0.87.1` with exact `@effect/tsgo@0.31.0`.
2. Keep exact `typescript@7.0.2`.
3. Preserve the existing `@effect/language-service` entry in `packages/api/tsconfig.json`.
4. Make `prepare` run the Effect source refresh and then `effect-tsgo patch`. Do not use `--force`.
5. Run the existing typecheck, tests, and build. Confirm that the editor uses Effect TypeScript-Go
   as its only TypeScript language server.
6. Review the initial diagnostic set before changing rule severities.

The separate `effect-tsgo diagnostics` command is a useful first-run and debugging path. The patched
`tsc` path is the intended steady state because the existing typecheck then performs type analysis
only once.

## Oxlint integration

The current workspace uses `oxlint@1.76.0`. The `@effect/tsgo@0.31.0` Oxlint profile is built for
`oxlint@1.77.0` and `oxlint-tsgolint@7.0.2001`
([version profile](https://github.com/Effect-TS/tsgo/blob/9eda97ef918dba182a45c7f4c9ebb8dcda899971/_packages/tsgo/upstream.json#L21-L36)).
The integration also requires type-aware mode and the `effecttsgo` plugin, and the patch command
validates the supported versions before changing binaries
([Oxlint guide](https://github.com/Effect-TS/tsgo/blob/9eda97ef918dba182a45c7f4c9ebb8dcda899971/docs/README.md#L27-L56)).

The source calls this integration experimental. It also has narrower platform support than the
TypeScript integration
([source](https://github.com/Effect-TS/tsgo/blob/9eda97ef918dba182a45c7f4c9ebb8dcda899971/_packages/tsgo/src/cli/experimentalOxlint.ts#L26-L31)).
It landed across releases `0.28.0` through `0.30.0` on 2026-08-04. This is too fresh to combine with
the required TypeScript migration in one change.

## Maturity and risk

The project is active and its release commit passed its main validation and profile workflows.
The main CI builds the project and runs repository checks and tests
([workflow](https://github.com/Effect-TS/tsgo/blob/9eda97ef918dba182a45c7f4c9ebb8dcda899971/.github/workflows/validate.yml#L17-L41)).
The Oxlint profile has a separate build and smoke-test workflow
([workflow](https://github.com/Effect-TS/tsgo/blob/9eda97ef918dba182a45c7f4c9ebb8dcda899971/.github/workflows/validate-oxlint-profile.yml#L17-L43)).

It is still a fast-moving pre-1.0 tool. Releases `0.28.0`, `0.29.0`, `0.30.0`, and `0.31.0` were all
published on 2026-08-04. A large open change is still revising compatibility matrices, patching, and
release workflows ([PR #546](https://github.com/Effect-TS/tsgo/pull/546)). Therefore:

- pin exact versions;
- do not use `--force` to bypass compatibility checks;
- upgrade deliberately after checking the pinned TypeScript and Oxlint profiles;
- keep the first adoption change limited to the TypeScript integration.

Other current limitations include an interactive setup flow
([issue #544](https://github.com/Effect-TS/tsgo/issues/544)) and an open pnpm platform-binary report
([issue #383](https://github.com/Effect-TS/tsgo/issues/383)). The latter has a recent successful
retest with pnpm 11 and `@effect/tsgo@0.31.0`, but it remains open.

## Conclusion

This is not an optional style-linter upgrade for Red Docket. The current Effect language-service
package is incompatible with the TypeScript 7 compiler already used by the repository. Adopt
`@effect/tsgo` now for Effect-aware TypeScript diagnostics, with exact pins and a narrow TypeScript
integration first. Evaluate the experimental Oxlint patch separately.
