import { e2eTestIds } from '#/testing/e2eTestIds'
import { expect, test } from '../helpers/electron'

test('restore: restores an archived Project and opens its Tickets', async ({ redDocket }) => {
  const { window } = redDocket

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  let dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('Restorable Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('RESTORE')
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()

  await window.getByTestId(e2eTestIds.project.archive.trigger).click()
  dialog = window.getByTestId(e2eTestIds.project.archive.dialog)
  await dialog.getByTestId(e2eTestIds.project.archive.confirm).click()

  await expect(window.getByTestId(e2eTestIds.project.empty)).toBeVisible()
  await window.getByTestId(e2eTestIds.project.archived.emptyTrigger).click()
  await expect(window).toHaveURL(/\/projects\/archived$/)
  await expect(window.getByTestId(e2eTestIds.project.archived.list)).toContainText(
    'RESTORE — Restorable Project'
  )

  await window.reload()
  await expect(window.getByTestId(e2eTestIds.project.archived.list)).toContainText(
    'RESTORE — Restorable Project'
  )

  let shouldDropRestoreResponse = true
  await window.route('**/api/rpc/**', async route => {
    const isRestoreRequest = new URL(route.request().url()).pathname.endsWith('/project/restore')

    if (isRestoreRequest && shouldDropRestoreResponse) {
      shouldDropRestoreResponse = false
      await route.fetch()
      await route.abort('failed')
      return
    }

    await route.continue()
  })

  await window.getByTestId(e2eTestIds.project.archived.restore).click()
  await expect(window).toHaveURL(/\/projects\/[0-9a-f-]+\/tickets$/)
  await expect(window.getByTestId(e2eTestIds.project.selector)).toContainText(
    'RESTORE — Restorable Project'
  )

  await window.getByTestId(e2eTestIds.project.archived.workspaceTrigger).click()
  await expect(window.getByTestId(e2eTestIds.project.archived.empty)).toBeVisible()
})
