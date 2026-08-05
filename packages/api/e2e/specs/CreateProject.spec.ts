import { e2eTestIds } from '#/testing/e2eTestIds'
import { expect, test } from '../helpers/electron'

test('create: creates and selects a Project after choosing a directory', async ({ redDocket }) => {
  const { application, packageDirectory, window } = redDocket

  await application.evaluate(
    ({ dialog }, filePaths) => {
      dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths })
    },
    [packageDirectory]
  )

  await expect(window.getByTestId(e2eTestIds.project.empty)).toBeVisible()
  await expect
    .poll(() =>
      window.evaluate(() => typeof document.defaultView?.redDocket?.selectProjectDirectory)
    )
    .toBe('function')

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  const dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('Playwright Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('E2E')
  await dialog.getByTestId(e2eTestIds.project.create.selectDirectory).click()
  await expect(dialog.getByTestId(e2eTestIds.project.create.directory)).toHaveValue(
    packageDirectory
  )
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()

  await expect(window.getByTestId(e2eTestIds.project.selector)).toContainText(
    'E2E — Playwright Project'
  )
  await expect(window).toHaveURL(/\/projects\/[0-9a-f-]+\/tickets$/)
})

test('create: clears a previous repository error when the dialog reopens', async ({
  redDocket,
}) => {
  const { window } = redDocket

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  let dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('Existing Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('DUP')
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()
  await expect(window.getByTestId(e2eTestIds.project.selector)).toContainText(
    'DUP — Existing Project'
  )

  await window.getByTestId(e2eTestIds.project.create.workspaceTrigger).click()
  dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('Conflicting Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('DUP')
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()
  await expect(dialog.getByTestId(e2eTestIds.project.create.error)).toBeVisible()
  await dialog.getByTestId(e2eTestIds.project.create.cancel).click()

  await window.getByTestId(e2eTestIds.project.create.workspaceTrigger).click()
  dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await expect(dialog.getByTestId(e2eTestIds.project.create.error)).toBeHidden()
})
