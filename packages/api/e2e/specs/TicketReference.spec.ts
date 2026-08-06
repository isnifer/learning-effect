import { e2eTestIds } from '#/testing/e2eTestIds'
import { expect, test } from '../helpers/electron'

test('reference: identifies Tickets with duplicate titles', async ({ redDocket }) => {
  const { window } = redDocket

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  const dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('Reference Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('REFERENCE')
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()

  await window.getByTestId(e2eTestIds.ticket.create.title).fill('Display the Ticket reference')
  await window.getByTestId(e2eTestIds.ticket.create.submit).click()
  await window.getByTestId(e2eTestIds.ticket.create.title).fill('Display the Ticket reference')
  await window.getByTestId(e2eTestIds.ticket.create.submit).click()

  await expect(window.getByTestId(e2eTestIds.ticket.reference)).toHaveText([
    'REFERENCE-2',
    'REFERENCE-1',
  ])
  await expect(
    window.getByRole('button', {
      name: 'Edit title for REFERENCE-2: Display the Ticket reference',
    })
  ).toBeVisible()
  await expect(
    window.getByRole('button', {
      name: 'Change status for REFERENCE-2: Display the Ticket reference',
    })
  ).toBeVisible()
})
