import { e2eTestIds } from '#/testing/e2eTestIds'
import { expect, test } from '../helpers/electron'

test('unlinkDirectory: unlinks a directory from the Project', async ({ redDocket }) => {
  const { application, packageDirectory, window } = redDocket

  await application.evaluate(
    ({ dialog }, filePaths) => {
      dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths })
    },
    [packageDirectory]
  )

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  const createDialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await createDialog.getByTestId(e2eTestIds.project.create.name).fill('Unlink Directory')
  await createDialog.getByTestId(e2eTestIds.project.create.key).fill('UNLINK')
  await createDialog.getByTestId(e2eTestIds.project.create.selectDirectory).click()
  await createDialog.getByTestId(e2eTestIds.project.create.submit).click()

  await window.getByTestId(e2eTestIds.project.directories.trigger).click()
  const directoriesDialog = window.getByTestId(e2eTestIds.project.directories.dialog)
  await directoriesDialog.getByTestId(e2eTestIds.project.directories.unlink).click()

  await expect(directoriesDialog.getByTestId(e2eTestIds.project.directories.empty)).toBeVisible()
})
