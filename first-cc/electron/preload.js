const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 使用 send 代替 invoke，fire-and-forget 模式
  showNotification: (data) => ipcRenderer.send('show-notification', data),
  setTitle: (title) => ipcRenderer.send('set-title', title),
  onToggleTimer: (callback) => ipcRenderer.on('toggle-timer', callback),
  onSkipTimer: (callback) => ipcRenderer.on('skip-timer', callback),
  onResetTimer: (callback) => ipcRenderer.on('reset-timer', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
