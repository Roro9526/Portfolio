const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Utilisez un fichier preload.js pour exposer l'API sécurisée
      nodeIntegration: false, // Désactive nodeIntegration
      contextIsolation: true, // Active contextIsolation pour plus de sécurité
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Ouvre la console de développement pour inspecter les erreurs (facultatif)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);
