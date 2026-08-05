import { e2eTestIds } from '#/testing/e2eTestIds'
import { expect, test } from '../helpers/electron'

test('linkDirectory: links a selected directory to the Project', async ({ redDocket }) => {
  const { application, packageDirectory, window } = redDocket

  await application.evaluate(
    ({ dialog }, filePaths) => {
      dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths })
    },
    [packageDirectory]
  )

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  const createDialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await createDialog.getByTestId(e2eTestIds.project.create.name).fill('Link Directory')
  await createDialog.getByTestId(e2eTestIds.project.create.key).fill('LINK')
  await createDialog.getByTestId(e2eTestIds.project.create.submit).click()

  await window.getByTestId(e2eTestIds.project.directories.trigger).click()
  const directoriesDialog = window.getByTestId(e2eTestIds.project.directories.dialog)
  await directoriesDialog.getByTestId(e2eTestIds.project.directories.link).click()

  await expect(directoriesDialog.getByTestId(e2eTestIds.project.directories.list)).toContainText(
    packageDirectory
  )
})

test('linkDirectory: shows an error when the picker returns an invalid path', async ({
  redDocket,
}) => {
  const { application, window } = redDocket

  await application.evaluate(({ dialog }) => {
    dialog.showOpenDialog = () =>
      Promise.resolve({ canceled: false, filePaths: ['relative/project-directory'] })
  })

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  const createDialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await createDialog.getByTestId(e2eTestIds.project.create.name).fill('Invalid Directory')
  await createDialog.getByTestId(e2eTestIds.project.create.key).fill('INVALID')
  await createDialog.getByTestId(e2eTestIds.project.create.submit).click()

  await window.getByTestId(e2eTestIds.project.directories.trigger).click()
  const directoriesDialog = window.getByTestId(e2eTestIds.project.directories.dialog)
  await directoriesDialog.getByTestId(e2eTestIds.project.directories.link).click()

  await expect(
    directoriesDialog.getByTestId(e2eTestIds.project.directories.linkError)
  ).toBeVisible()
})
