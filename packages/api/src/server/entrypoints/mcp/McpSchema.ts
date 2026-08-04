import type { StandardSchemaWithJSON } from '@modelcontextprotocol/server'
import * as Schema from 'effect/Schema'

const McpSchema = <S extends Schema.ConstraintDecoder<unknown>>(
  schema: S
): StandardSchemaWithJSON<S['Encoded'], S['Type']> =>
  Schema.toStandardJSONSchemaV1(Schema.toStandardSchemaV1(schema))

export default McpSchema
