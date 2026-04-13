const { app, BrowserWindow, shell, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

const isDev = !app.isPackaged
const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Klinika Booking',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // file:// can't load ESM modules with default webSecurity. The packaged
      // app only loads its own bundled assets, so disabling is acceptable.
      webSecurity: isDev,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL(devUrl)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return win
}

function setupAutoUpdate(win) {
  if (isDev) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    win.webContents.send('update-available', info.version)
  })

  autoUpdater.on('update-downloaded', async (info) => {
    const { response } = await dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['Hozir o\u2018rnatish', 'Keyinroq'],
      defaultId: 0,
      cancelId: 1,
      title: 'Yangilanish tayyor',
      message: `Klinika Booking ${info.version} yuklab olindi.`,
      detail: 'Yangilanishni o\u2018rnatish uchun ilova qayta ishga tushiriladi.',
    })
    if (response === 0) autoUpdater.quitAndInstall()
  })

  autoUpdater.on('error', (err) => {
    console.error('[auto-update] error:', err)
  })

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('[auto-update] check failed:', err)
  })
}

app.whenReady().then(() => {
  const win = createWindow()
  setupAutoUpdate(win)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const w = createWindow()
      setupAutoUpdate(w)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
