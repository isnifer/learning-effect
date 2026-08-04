# Prefer truthiness checks for absent values

Use `if (!value)` and `if (value)` instead of comparisons with `null` or `undefined` when the
value's only absent variants are `null` or `undefined`, or when every falsy value has the same
meaning.

Do not use `=== null`, `=== undefined`, `!== null`, or `!== undefined` by default.

Use an explicit nullish comparison only when at least one of these conditions applies:

- a valid falsy value such as `0`, `''`, `false`, `0n`, or `NaN` must remain distinct from absence;
- `null` and `undefined` have different meanings in an external or domain contract;
- an API or TypeScript narrowing constraint cannot be expressed correctly with a truthiness check.

Keep each exception local and make the distinct nullish semantics evident from the surrounding
code.
