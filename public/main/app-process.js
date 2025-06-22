// main/app-process.js

const { app,BrowserWindow } = require("electron");
const path = require("path");

function createAppWindow() {
  /*let win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    }
  });
  window.electronAPI.getProfile();
  win.loadFile('./homepage.html');

  win.on('closed', () => {
    win = null;
  });*/
  
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      // devTools: false,
      contextIsolation: false,
    },
    fullscreen: false,
    frame: true,
    icon: 'logo.png'
  })

  mainWindow.maximize();
  mainWindow.setMenuBarVisibility(false);
  
  mainWindow.loadFile('homepage.html');
  return mainWindow;
}

module.exports = createAppWindow;