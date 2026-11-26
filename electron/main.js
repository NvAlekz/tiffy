'use strict';

const {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  Menu,
  screen,
  session,
  shell,
} = require('electron');
const path = require('node:path');

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = Boolean(DEV_SERVER_URL) && !app.isPackaged;

const WINDOW_WIDTH = 360;
const WINDOW_HEIGHT = 520;
const WINDOW_MARGIN = 24;
const OPACITY_LEVELS = [1, 0.75, 0.45, 0.2];

let mainWindow = null;
let isQuitting = false;
let clickThrough = false;
let opacityIndex = 0;

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function currentState() {
  return {
    ghostMode: clickThrough,
    opacity: OPACITY_LEVELS[opacityIndex],
    visible: Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()),
    contentProtected: true,
    platform: process.platform,
  };
}

function setGhostMode(enabled) {
  clickThrough = Boolean(enabled);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
    sendToRenderer('tiffy:ghost-mode', clickThrough);
  }

  return currentState();
}

function cycleOpacity() {
  opacityIndex = (opacityIndex + 1) % OPACITY_LEVELS.length;
  const opacity = OPACITY_LEVELS[opacityIndex];

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setOpacity(opacity);
    sendToRenderer('tiffy:opacity', opacity);
  }

  return currentState();
}

function toggleVisibility() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
    return;
  }

  mainWindow.showInactive();
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
}

function registerIpcHandlers() {
  ipcMain.handle('tiffy:get-state', () => currentState());
  ipcMain.handle('tiffy:toggle-ghost', () => setGhostMode(!clickThrough));
  ipcMain.handle('tiffy:cycle-opacity', () => cycleOpacity());
  ipcMain.handle('tiffy:hide-window', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
    return currentState();
  });
  ipcMain.handle('tiffy:copy-text', (_event, text) => {
    if (typeof text !== 'string' || text.length === 0) return false;
    clipboard.writeText(text.slice(0, 20_000));
    return true;
  });
  ipcMain.on('tiffy:quit', () => app.quit());
}

function registerGlobalShortcuts() {
  const shortcuts = [
    ['CommandOrControl+Shift+H', toggleVisibility],
    ['CommandOrControl+Shift+J', () => setGhostMode(!clickThrough)],
    ['CommandOrControl+Shift+O', cycleOpacity],
  ];

  for (const [accelerator, handler] of shortcuts) {
    const registered = globalShortcut.register(accelerator, handler);
    if (!registered) {
      console.warn(`[tiffy] No se pudo registrar el atajo ${accelerator}`);
    }
  }
}

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 280,
    minHeight: 350,
    x: Math.round(workArea.x + workArea.width - WINDOW_WIDTH - WINDOW_MARGIN),
    y: Math.round(workArea.y + WINDOW_MARGIN),
    show: false,
    frame: false,
    transparent: true,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    type: 'toolbar',
    hasShadow: false,
    roundedCorners: false,
    backgroundColor: '#00000000',
    title: 'Tiffy',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged,
      navigateOnDragDrop: false,
    },
  });

  mainWindow.setSkipTaskbar(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setContentProtection(true);
  mainWindow.setOpacity(OPACITY_LEVELS[opacityIndex]);

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setContentProtection(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (navigationUrl !== currentUrl) event.preventDefault();
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.setAppUserModelId('com.tiffy.desktop');

  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isVisible()) mainWindow.showInactive();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    registerIpcHandlers();
    createWindow();
    registerGlobalShortcuts();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
