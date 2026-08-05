import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
} from 'electron'
import { SELECT_PROJECT_DIRECTORY_CHANNEL } from './DesktopApi'

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined

let httpServer: Awaited<
  ReturnType<typeof import('#/server/entrypoints/http/StartHttpServer').default>
>
let isQuitting = false

async function startBackend() {
  process.env.DATABASE_PATH = join(app.getPath('userData'), 'app.sqlite')
  process.env.MIGRATIONS_PATH = app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : join(app.getAppPath(), 'migrations')

  const { default: StartHttpServer } = await import('#/server/entrypoints/http/StartHttpServer')

  return StartHttpServer({
    host: '127.0.0.1',
    port: Number(process.env.PORT ?? 3000),
    staticDirectory: app.isPackaged
      ? fileURLToPath(new URL('../renderer/main_window', import.meta.url))
      : undefined,
  })
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js'),
      sandbox: true,
    },
  })

  if (!app.isPackaged) {
    window.webContents.on('console-message', details => {
      console.log(`[renderer:${details.level}] ${details.message}`)
    })
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    return
  }

  await window.loadURL(httpServer.url)
}

async function selectProjectDirectory(event: IpcMainInvokeEvent) {
  const window = BrowserWindow.fromWebContents(event.sender)
  const options: OpenDialogOptions = {
    title: 'Select Project directory',
    buttonLabel: 'Select directory',
    properties: ['openDirectory', 'createDirectory'],
  }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)

  return result.canceled ? undefined : result.filePaths[0]
}

async function main() {
  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows()[0]

    if (window?.isMinimized()) {
      window.restore()
    }

    window?.focus()
  })

  await app.whenReady()

  ipcMain.handle(SELECT_PROJECT_DIRECTORY_CHANNEL, selectProjectDirectory)

  if (process.platform === 'darwin' && !app.isPackaged) {
    app.dock?.setIcon(join(app.getAppPath(), 'assets/icon.png'))
  }

  httpServer = await startBackend()
  await createWindow()

  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) {
      void createWindow()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', event => {
    if (isQuitting) {
      return
    }

    event.preventDefault()
    void httpServer.close().then(() => {
      isQuitting = true
      app.quit()
    })
  })
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  void main()
}
