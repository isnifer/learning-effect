# Reuse domain literal schemas across outer layers

When a closed set of values is part of the domain language, define it once as an exported
`Schema.Literals` schema in the domain layer.

Outer layers may depend on that domain schema. Reuse its `.literals` value for adapter metadata and
persistence constraints instead of declaring parallel value arrays.

For Drizzle SQLite tables:

- pass the domain schema's `.literals` to the text column's `enum` option;
- build the database `CHECK` constraint from the same `.literals` value with
  `sql.join(...).inlineParams()`;
- do not treat Drizzle's `enum` option as a database constraint by itself.

Do not use `inArray` directly in a generated SQLite `CHECK`. Drizzle Kit serializes its values as
`?` placeholders in the DDL and detects a false schema change instead of producing literal values.

Keep a default value as a separate rule. Do not infer a default from the first item in the allowed
values list.

Generated migrations are immutable historical snapshots. They may contain the expanded literal
values and are not another source of truth.
