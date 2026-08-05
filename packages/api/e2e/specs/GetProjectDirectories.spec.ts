import { e2eTestIds } from '#/testing/e2eTestIds'
import { expect, test } from '../helpers/electron'

test('getDirectories: shows directories linked to the selected Project', async ({ redDocket }) => {
  const { application, packageDirectory, window } = redDocket

  await application.evaluate(
    ({ dialog }, filePaths) => {
      dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths })
    },
    [packageDirectory]
  )

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  const createDialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await createDialog.getByTestId(e2eTestIds.project.create.name).fill('Project Directories')
  await createDialog.getByTestId(e2eTestIds.project.create.key).fill('DIR')
  await createDialog.getByTestId(e2eTestIds.project.create.selectDirectory).click()
  await createDialog.getByTestId(e2eTestIds.project.create.submit).click()

  await window.getByTestId(e2eTestIds.project.directories.trigger).click()
  const directoriesDialog = window.getByTestId(e2eTestIds.project.directories.dialog)

  await expect(directoriesDialog).toContainText('Directories linked to DIR — Project Directories.')
  await expect(directoriesDialog.getByTestId(e2eTestIds.project.directories.list)).toContainText(
    packageDirectory
  )
})
