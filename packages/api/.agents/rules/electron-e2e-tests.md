# Organize Electron E2E tests

Keep Playwright Electron scenarios in `e2e/specs` and reusable test infrastructure in
`e2e/helpers`.

Helpers may own application launch, isolated temporary `userData`, window acquisition, teardown,
and other inert infrastructure. Keep scenario steps, mocks, assertions, and test registration visible
in each spec.

Define stable DOM selectors in `src/testing/e2eTestIds.ts`. Production markup and specs must import
the same `e2eTestIds` values instead of duplicating `data-testid` string literals or assembling brittle
selectors by hand.

Test user-observable behavior through the packaged Electron application. Do not read SQLite directly
from E2E tests. Verify repository persistence, atomicity, and rollback in repository integration tests.

Run the suite with `pnpm test:e2e` from the workspace root.
