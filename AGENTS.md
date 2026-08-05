# Workspace instructions

Keep pnpm workspace configuration and settings in `pnpm-workspace.yaml`, not `package.json`.

Always install dependencies with exact versions. Do not use `^`, `~`, or other version ranges.

Each package under `packages/*` must own its package-specific instructions in an `AGENTS.md` and
package-specific supporting rules in `.agents/`. Keep only instructions that apply to every package
in this root file.

## Workspace rules

- [Colocate tests with tested modules](.agents/rules/colocated-tests.md)
- [Write tests explicitly](.agents/rules/explicit-tests.md)
- [Name tests by subject, context, and behavior](.agents/rules/test-naming.md)
- [Use regular expressions only as a last resort](.agents/rules/regular-expressions.md)
- [Use the desktop-first development workflow](.agents/rules/development-workflow.md)
- [Use the Red Docket product identity](.agents/rules/product-identity.md)

## Package instructions

- [`packages/api/AGENTS.md`](packages/api/AGENTS.md)

## Contexts

See [`CONTEXT-MAP.md`](CONTEXT-MAP.md) for the workspace context map.
