const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('promptStudio', {
  pickImage: () => ipcRenderer.invoke('images:pick'),
  loadPreview: (filePath) => ipcRenderer.invoke('image:preview', filePath),
  loadThumbnail: (filePath) => ipcRenderer.invoke('image:thumbnail', filePath),
  listProjects: () => ipcRenderer.invoke('projects:list'),
  createProject: (name) => ipcRenderer.invoke('projects:create', name),
  loadProject: (projectId) => ipcRenderer.invoke('projects:load', projectId),
  saveProject: (project) => ipcRenderer.invoke('projects:save', project),
  deleteProject: (projectId) => ipcRenderer.invoke('projects:delete', projectId),
  exportProject: (project) => ipcRenderer.invoke('projects:export', project),
  importProject: () => ipcRenderer.invoke('projects:import'),
  openProjectsFolder: () => ipcRenderer.invoke('projects:openFolder'),
  addImageToProject: (payload) => ipcRenderer.invoke('projects:addImage', payload),
  pickModelFolder: () => ipcRenderer.invoke('models:pickFolder'),
  scanModelFolder: (folderPath) => ipcRenderer.invoke('models:scan', folderPath),
  addModelFiles: (folderPath) => ipcRenderer.invoke('models:addFiles', folderPath),
  checkEnvironment: (folderPath) => ipcRenderer.invoke('env:check', folderPath),
  prepareEnvironment: (folderPath) => ipcRenderer.invoke('env:prepare', folderPath),
  generatePrompt: (payload) => ipcRenderer.invoke('prompt:generate', payload),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('updates:status', (_event, payload) => callback(payload));
  }
});
