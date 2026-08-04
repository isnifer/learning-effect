# Colocate tests with tested modules

Place each test file next to the module that it tests. Use the module name with a `.test.ts` suffix,
such as `D1TodoRepository.test.ts` next to `D1TodoRepository.ts`.

Keep only shared test setup, fixtures, and utilities in dedicated test directories. Create shared
test infrastructure only after more than one colocated test needs it.
