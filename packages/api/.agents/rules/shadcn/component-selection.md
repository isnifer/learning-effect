# Prefer shadcn components

Before building an application component from primitives, check whether shadcn provides a component
that already implements the required behavior.

Use the existing shadcn component directly when it satisfies the use case. If it is not installed,
inspect it with the shadcn CLI and install it through the CLI.

Use React Aria Components only when the required primitive is not available from shadcn.

Create an application wrapper only when it adds stable composition, shared defaults, or an
application-facing API. Do not wrap or replace a suitable shadcn component only to rename or restyle
it.

Do not customize shadcn-owned primitives under `src/components/ui`. Compose them in application
components and define application variants with CVA at that layer.
