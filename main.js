const { app, BrowserWindow, protocol, Menu } = require('electron');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const url = require('url');
const path = require('path');
const log = require('electron-log');

const sep = path.sep;

const { ipcMain } = require('electron');

let mainWindow;

// DEV_MODE cannot come from .env as it is needed to load .env :)
let resourcesPath = process.env.DEV_MODE
  ? `${process.cwd()}${sep}`
  : `${process.resourcesPath}${sep}`;

log.info(resourcesPath);

require('dotenv').config({ path: `${resourcesPath}.env` });

let useLocalHost = process.env.DEV_MODE && process.env.USE_LOCAL_HOST;
log.info(useLocalHost);

function createWindow() {
  if (mainWindow != null) {
    mainWindow.focus();
    return;
  }
  let windowOptions = {
    webPreferences: { nodeIntegration: true },
    title: `Incident Logger`,
    affinity: `0`,
    width: 1280,
    height: 720
  };

  mainWindow = {
    id: -1,
    window: new BrowserWindow(windowOptions)
  };

  let loadUrl;
  if (useLocalHost) {
    loadUrl = 'http://localhost:4200/';
  } else {
    loadUrl = url.format({
      pathname: `index.html`,
      protocol: 'file:',
      slashes: true
    });
  }
  log.info(loadUrl);
  mainWindow.window.loadURL(loadUrl);

  mainWindow.window.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.window.on('focus', event => {});
}

app.on('ready', () => {
  protocol.interceptFileProtocol(
    'file',
    (request, callback) => {
      const file = `${resourcesPath}dist${sep}${request.url.substr(8)}`;
      log.info(file);
      callback({ path: file });
    },
    err => {
      if (err) console.error('Failed to register protocol');
    }
  );

  const template = menuTemplate();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createWindow();
});

app.on('will-quit', async event => {
});

// on macOS, closing the window doesn't quit the app
// We are not closing the app when all windows are closed
// On windows we are closing the app
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// initialize the app's main window
app.on('activate', () => {});

function menuTemplate() {
  const template = [
    {
      label: 'Edit',
      submenu: [
        // { role: 'undo' },
        // { role: 'redo' },
        // { type: 'separator' },
        // { role: 'cut' },
        // { role: 'copy' },
        // { role: 'paste' },
        // { role: 'pasteandmatchstyle' },
        // { role: 'delete' },
        // { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        {
          label: 'test',
          accelerator: 'CommandOrControl+T',
          click(e) {
            killChildren(px_services.pid);
          }
        }
      ]
    },
    {
      role: 'window'
    }
  ];

  if (process.platform !== 'darwin') {
    template.shift();
    template[1].submenu = [
      {
        label: 'New Window',
        accelerator: 'CommandOrControl+N',
        click(e) {
          createWindow();
        }
      },
      {
        label: 'Open PrintX Online Window',
        accelerator: 'CommandOrControl+Alt+N',
        click(e) {
          createPrintXOnlineWindow();
        }
      },
      {
        label: 'Next Window',
        accelerator: 'CommandOrControl+Right',
        click(e) {
          nextWindow();
        }
      },
      {
        label: 'Previous Window',
        accelerator: 'CommandOrControl+Left',
        click(e) {
          prevWindow();
        }
      },
      { role: 'minimize' },
      { role: 'close' }
    ];
  } else {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Edit menu
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }]
      }
    );

    // Window menu
    template[3].submenu = [
      {
        label: 'New Window',
        accelerator: 'CommandOrControl+N',
        click(e) {
          createWindow();
        }
      },
      {
        label: 'Open PrintX Online Window',
        accelerator: 'CommandOrControl+Alt+N',
        click(e) {
          createWindow();
        }
      },
      {
        label: 'Next Window',
        accelerator: 'CommandOrControl+Right',
        click(e) {
          nextWindow();
        }
      },
      {
        label: 'Previous Window',
        accelerator: 'CommandOrControl+Left',
        click(e) {
          prevWindow();
        }
      },
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  return template;
}

function nextWindow() {}

function prevWindow() {}

function notMacSpecial(file) {
  return file.indexOf('__MACOSX') === -1;
}
