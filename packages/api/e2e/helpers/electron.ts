import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  _electron as electron,
  expect,
  test as base,
  type ElectronApplication,
  type Page,
} from '@playwright/test'

interface RedDocketElectron {
  application: ElectronApplication
  packageDirectory: string
  window: Page
}

interface ElectronFixtures {
  redDocket: RedDocketElectron
}

const packageDirectory = dirname(fileURLToPath(new URL('../../package.json', import.meta.url)))

const executablePath =
  process.platform === 'darwin'
    ? join(
        packageDirectory,
        'out',
        `Red Docket-${process.platform}-${process.arch}`,
        'Red Docket.app',
        'Contents',
        'MacOS',
        'Red Docket'
      )
    : join(
        packageDirectory,
        'out',
        `Red Docket-${process.platform}-${process.arch}`,
        process.platform === 'win32' ? 'Red Docket.exe' : 'Red Docket'
      )

export const test = base.extend<ElectronFixtures>({
  // oxlint-disable-next-line eslint/no-empty-pattern -- Playwright fixtures require object destructuring.
  redDocket: async ({}, use) => {
    const userDataDirectory = await mkdtemp(join(tmpdir(), 'red-docket-e2e-'))
    let application: ElectronApplication | undefined

    try {
      application = await electron.launch({
        executablePath,
        args: [`--user-data-dir=${userDataDirectory}`],
        env: {
          ...process.env,
          PORT: '0',
        },
      })
      const window = await application.firstWindow()

      await use({ application, packageDirectory, window })
    } finally {
      try {
        await application?.close()
      } finally {
        await rm(userDataDirectory, { recursive: true, force: true })
      }
    }
  },
})

export { expect }
