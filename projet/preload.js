const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startBot: () => ipcRenderer.invoke('start-bot'),
});
