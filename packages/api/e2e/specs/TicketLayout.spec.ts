import { e2eTestIds } from '#/testing/e2eTestIds'
import { expect, test } from '../helpers/electron'

test('layout: keeps Ticket filters above the Ticket list', async ({ redDocket }) => {
  const { window } = redDocket

  await window.getByTestId(e2eTestIds.project.create.emptyTrigger).click()
  const dialog = window.getByTestId(e2eTestIds.project.create.dialog)
  await dialog.getByTestId(e2eTestIds.project.create.name).fill('Layout Project')
  await dialog.getByTestId(e2eTestIds.project.create.key).fill('LAYOUT')
  await dialog.getByTestId(e2eTestIds.project.create.submit).click()

  const tabList = window.getByRole('tablist', { name: 'Filter Tickets' })
  const tabPanel = window.getByRole('tabpanel')
  const [tabListBox, tabPanelBox] = await Promise.all([
    tabList.boundingBox(),
    tabPanel.boundingBox(),
  ])

  expect(tabListBox).toBeTruthy()
  expect(tabPanelBox).toBeTruthy()

  if (!tabListBox || !tabPanelBox) {
    return
  }

  expect(tabListBox.y + tabListBox.height).toBeLessThanOrEqual(tabPanelBox.y)
})
