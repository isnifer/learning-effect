# Place each schema-derived type next to its schema

Place a TypeScript type derived from an Effect runtime schema immediately after the schema that it
references.

```ts
export const CreateTicketInput = Ticket.mapFields(Struct.pick(['title']))
export type TCreateTicketInput = typeof CreateTicketInput.Type
```

Do not collect schema-derived types into a separate block elsewhere in the module.
