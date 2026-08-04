# Components

## Guide

Each component should be created in a separate folder following PascalCase, like
`ComponentName`. The directory name must match the main component default export
name.

The folder must contain a file named like the component, for example
`ComponentName.tsx`.

The folder must also contain an `index.ts` barrel file which re-exports the
component default export from `ComponentName.tsx`.

Component files must use a single default exported function declaration:
`export default function ComponentName(props: ComponentNameProps) { ... }`.

Do not write components as `const ComponentName = (...) => { ... }` followed by
`export default ComponentName`.

Do not add a named export for the same component or function.

When a complete control requires a repeated composition of shadcn primitives, expose that
composition through an application component. Screen files should pass the control's value,
options, callbacks, and state instead of assembling its trigger, content, and items inline.

Do not create an application wrapper that only forwards the primitive's props without adding a
stable composition, shared defaults, or application-facing API.

This export style is also a migration marker. When creating a new component or
rewriting, extracting, or decomposing a legacy component, convert the touched
component to `export default function ComponentName(...)`. Legacy components
that still use `const Component = ...; export default Component` have not yet
been migrated.

The component name must use PascalCase and match the file name.

Put a component's UI kind at the beginning of its name so components of the same kind sort together.
For example, use `FormCreateTask`, `DialogCreateTask`, and `SkeletonTaskList` instead of
`CreateTaskForm`, `CreateTaskDialog`, and `TaskListSkeleton`.

Within a feature directory, place component directories directly under the
feature root. Do not introduce generic organizational layers such as
`components/` or `components/overlays/` only to group component directories.
The component's own PascalCase directory and barrel file are the required
organizational boundary.

This rule applies to child components as well. Child components used only by a
parent component should live inside the parent component directory.

SVG icon components under `src/icons` are an exception. Keep each icon as a
single `.tsx` file directly inside `src/icons`; do not create a matching
component directory or `index.ts` barrel for icons.

Boolean JSX props with `true` value must be passed without an explicit value.
Use `propName`, not `propName={true}`. Explicit boolean values are only needed
for `false`, for example when a component default is `true` and the caller needs
to disable it with `propName={false}`.

## Structure

```text
FeatureName/
  ComponentName/
    ComponentName.tsx
    index.ts
    ChildComponentName/
      ChildComponentName.tsx
      index.ts
```

Do not add redundant grouping directories:

```text
FeatureName/
  components/
    overlays/
      ComponentName/
```

The structure inside each component directory remains:

```text
ComponentName/
  ComponentName.tsx
  index.ts
  ChildComponentName/
    ChildComponentName.tsx
    index.ts
```

## Examples

```tsx
// ComponentName.tsx

interface ComponentNameProps {
  id: string
}

export default function ComponentName(props: ComponentNameProps) {
  return <div>{props.id}</div>
}
```

```ts
// index.ts
export { default } from './ComponentName'
```
