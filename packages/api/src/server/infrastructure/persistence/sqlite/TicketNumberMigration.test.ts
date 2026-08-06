import { readFileSync } from 'node:fs'
import { describe, expect, it } from '@effect/vitest'
import Database from 'better-sqlite3'

const migration = readFileSync(
  new URL('../../../../../migrations/0005_brief_blizzard.sql', import.meta.url),
  'utf8'
).replaceAll('--> statement-breakpoint', '')

describe('TicketNumberMigration', () => {
  it('migrate: backfills Project-local numbers and preserves Ticket constraints', () => {
    const database = new Database(':memory:')
    database.pragma('foreign_keys = ON')
    database.exec(`
      CREATE TABLE projects (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        key text NOT NULL UNIQUE,
        created_at integer NOT NULL,
        archived_at integer
      );
      CREATE TABLE tickets (
        id text PRIMARY KEY NOT NULL,
        project_id text NOT NULL REFERENCES projects(id),
        title text NOT NULL,
        status text DEFAULT 'TODO' NOT NULL,
        created_at integer NOT NULL,
        CONSTRAINT tickets_status_check CHECK(status in ('TODO', 'IN_PROGRESS', 'COMPLETED'))
      );
      CREATE TRIGGER tickets_active_project_insert
      BEFORE INSERT ON tickets
      FOR EACH ROW
      WHEN EXISTS (
        SELECT 1
        FROM projects
        WHERE projects.id = NEW.project_id
          AND projects.archived_at IS NOT NULL
      )
      BEGIN
        SELECT RAISE(ABORT, 'tickets_project_archived');
      END;

      INSERT INTO projects (id, name, key, created_at, archived_at) VALUES
        ('019fcc1a-bd5d-751e-9a30-0bc92d133b20', 'Red Docket', 'RD', 1, NULL),
        ('019fcc1a-bd5d-751e-9a30-0bc92d133b21', 'Other Project', 'OTHER', 2, NULL);
      INSERT INTO tickets (id, project_id, title, status, created_at) VALUES
        (
          '019fcc1a-bd5d-751e-9a30-0bc92d133b32',
          '019fcc1a-bd5d-751e-9a30-0bc92d133b20',
          'Newer Red Docket Ticket',
          'TODO',
          4
        ),
        (
          '019fcc1a-bd5d-751e-9a30-0bc92d133b30',
          '019fcc1a-bd5d-751e-9a30-0bc92d133b20',
          'Older Red Docket Ticket',
          'TODO',
          3
        ),
        (
          '019fcc1a-bd5d-751e-9a30-0bc92d133b31',
          '019fcc1a-bd5d-751e-9a30-0bc92d133b21',
          'Other Project Ticket',
          'TODO',
          3
        );
    `)

    database.exec(migration)

    const ticketItems = database
      .prepare('SELECT project_id AS projectId, id, number FROM tickets ORDER BY project_id, id')
      .all()

    expect(ticketItems).toStrictEqual([
      {
        projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b20',
        id: '019fcc1a-bd5d-751e-9a30-0bc92d133b30',
        number: 1,
      },
      {
        projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b20',
        id: '019fcc1a-bd5d-751e-9a30-0bc92d133b32',
        number: 2,
      },
      {
        projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b21',
        id: '019fcc1a-bd5d-751e-9a30-0bc92d133b31',
        number: 1,
      },
    ])

    expect(() =>
      database.exec(`
        INSERT INTO tickets (id, project_id, number, title, status, created_at)
        VALUES (
          '019fcc1a-bd5d-751e-9a30-0bc92d133b33',
          '019fcc1a-bd5d-751e-9a30-0bc92d133b21',
          1,
          'Duplicate Number',
          'TODO',
          5
        )
      `)
    ).toThrow('UNIQUE constraint failed: tickets.project_id, tickets.number')

    expect(() =>
      database.exec(`
        INSERT INTO tickets (id, project_id, number, title, status, created_at)
        VALUES (
          '019fcc1a-bd5d-751e-9a30-0bc92d133b35',
          '019fcc1a-bd5d-751e-9a30-0bc92d133b21',
          0,
          'Invalid Number',
          'TODO',
          5
        )
      `)
    ).toThrow('CHECK constraint failed: tickets_number_check')

    database.exec(`
      UPDATE projects
      SET archived_at = 6
      WHERE id = '019fcc1a-bd5d-751e-9a30-0bc92d133b20'
    `)

    expect(() =>
      database.exec(`
        INSERT INTO tickets (id, project_id, number, title, status, created_at)
        VALUES (
          '019fcc1a-bd5d-751e-9a30-0bc92d133b34',
          '019fcc1a-bd5d-751e-9a30-0bc92d133b20',
          3,
          'Archived Project Ticket',
          'TODO',
          7
        )
      `)
    ).toThrow('tickets_project_archived')

    database.close()
  })
})
