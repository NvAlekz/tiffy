'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('El listener debe ser una función.');
  }

  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

const api = {
  getState: () => ipcRenderer.invoke('tiffy:get-state'),
  toggleGhostMode: () => ipcRenderer.invoke('tiffy:toggle-ghost'),
  cycleOpacity: () => ipcRenderer.invoke('tiffy:cycle-opacity'),
  hideWindow: () => ipcRenderer.invoke('tiffy:hide-window'),
  copyText: (text) => ipcRenderer.invoke('tiffy:copy-text', text),
  quit: () => ipcRenderer.send('tiffy:quit'),
  onGhostModeChange: (callback) => subscribe('tiffy:ghost-mode', callback),
  onOpacityChange: (callback) => subscribe('tiffy:opacity', callback),
};

contextBridge.exposeInMainWorld('tiffy', Object.freeze(api));
