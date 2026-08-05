import { e2eTestIds } from '#/testing/e2eTestIds'
import { expect, test } from '../helpers/electron'

test('navigate: restores the Project and Ticket filter from the URL', async ({ redDocket }) => {
  const { window } = redDocket

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  let dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('First Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('FIRST')
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()
  await expect(window.getByTestId(e2eTestIds.project.selector)).toContainText(
    'FIRST — First Project'
  )
  const firstProjectUrl = window.url()

  await window.getByTestId(e2eTestIds.project.create.workspaceTrigger).click()
  dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('Second Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('SECOND')
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()
  await expect(window.getByTestId(e2eTestIds.project.selector)).toContainText(
    'SECOND — Second Project'
  )
  await expect(window).not.toHaveURL(firstProjectUrl)

  await window.getByTestId(e2eTestIds.project.selector).click()
  await window.getByRole('option', { name: 'FIRST — First Project' }).click()
  await expect(window).toHaveURL(firstProjectUrl)

  await window.getByRole('tab', { name: 'In progress' }).click()
  await expect(window).toHaveURL(`${firstProjectUrl}?status=IN_PROGRESS`)

  await window.reload()

  await expect(window.getByTestId(e2eTestIds.project.selector)).toContainText(
    'FIRST — First Project'
  )
  await expect(window.getByRole('tab', { name: 'In progress' })).toHaveAttribute(
    'aria-selected',
    'true'
  )

  const staleProjectUrl = new URL(window.url())
  staleProjectUrl.pathname = '/projects/stale-project/tickets'
  await window.goto(staleProjectUrl.toString())

  await expect(window.getByTestId(e2eTestIds.project.selector)).toContainText(
    'SECOND — Second Project'
  )
  await expect(window).toHaveURL(/\/projects\/[0-9a-f-]+\/tickets\?status=IN_PROGRESS$/)
})
