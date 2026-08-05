import { e2eTestIds } from '#/testing/e2eTestIds'
import { expect, test } from '../helpers/electron'

test('archive: selects another active Project and shows bootstrap after the last Project', async ({
  redDocket,
}) => {
  const { window } = redDocket

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  let dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('First Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('FIRST')
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()

  await window.getByTestId(e2eTestIds.project.create.workspaceTrigger).click()
  dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('Second Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('SECOND')
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()

  let releaseArchiveRequest = () => {}
  const archiveRequestBlock = new Promise<void>(resolve => {
    releaseArchiveRequest = resolve
  })
  let shouldBlockArchiveRequest = true

  await window.route('**/api/rpc/**', async route => {
    const isArchiveRequest = new URL(route.request().url()).pathname.endsWith('/project/archive')

    if (isArchiveRequest && shouldBlockArchiveRequest) {
      shouldBlockArchiveRequest = false
      await archiveRequestBlock
    }

    await route.continue()
  })

  await window.getByTestId(e2eTestIds.project.archive.trigger).click()
  dialog = window.getByTestId(e2eTestIds.project.archive.dialog)
  await expect(dialog).toContainText('Archive SECOND?')
  await expect(dialog.getByRole('alertdialog')).toHaveAccessibleDescription(
    'The Project and its Tickets will become read-only. You can restore the Project later.'
  )
  await dialog.getByTestId(e2eTestIds.project.archive.confirm).click()
  await expect(dialog.getByTestId(e2eTestIds.project.archive.confirm)).toHaveText('Archiving…')

  await window.keyboard.press('Escape')
  await expect(dialog).toBeVisible()

  releaseArchiveRequest()

  await expect(window.getByTestId(e2eTestIds.project.selector)).toContainText(
    'FIRST — First Project'
  )
  await expect(window).toHaveURL(/\/projects\/[0-9a-f-]+\/tickets$/)

  await window.reload()
  await expect(window.getByTestId(e2eTestIds.project.selector)).toContainText(
    'FIRST — First Project'
  )

  await window.getByTestId(e2eTestIds.project.archive.trigger).click()
  dialog = window.getByTestId(e2eTestIds.project.archive.dialog)
  await expect(dialog).toContainText('Archive FIRST?')
  await dialog.getByTestId(e2eTestIds.project.archive.confirm).click()

  await expect(window).toHaveURL(/\/$/)
  await expect(window.getByTestId(e2eTestIds.project.empty)).toBeVisible()
})
