import { contextBridge, ipcRenderer } from 'electron'
import type DesktopApi from './DesktopApi'
import { SELECT_PROJECT_DIRECTORY_CHANNEL } from './DesktopApi'

const desktopApi: DesktopApi = {
  selectProjectDirectory: () => ipcRenderer.invoke(SELECT_PROJECT_DIRECTORY_CHANNEL),
}

contextBridge.exposeInMainWorld('redDocket', desktopApi)
