import { describe, expect, it } from '@effect/vitest'
import * as Schema from 'effect/Schema'
import { ProjectKey } from './Project'
import { getTicketReference, TicketNumber } from './Ticket'

describe('Ticket', () => {
  it('getTicketReference: combines a Project key and Project-local Ticket number', () => {
    const projectKey = Schema.decodeUnknownSync(ProjectKey)('RD')
    const ticketNumber = Schema.decodeUnknownSync(TicketNumber)(3)

    expect(getTicketReference(projectKey, ticketNumber)).toBe('RD-3')
  })
})
