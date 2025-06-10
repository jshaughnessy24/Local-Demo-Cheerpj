const { app, ipcMain, BrowserWindow } = require('electron')
const path = require('path')

const { createAuthWindow, createLogoutWindow, createLoginWindow } = require('./main/auth-process');
const authService = require('./services/auth-service');
const apiService = require('./services/api-service');
const leaderboardservice = require('./services/leaderboard-service');
const createAppWindow = require('./main/app-process');

//console.log(leaderboardservice);
var appWindow = null;

if (handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

async function createWindow() {
  // Create the browser window.
  appWindow = null;
  const gotTheLock = app.requestSingleInstanceLock();
  if (gotTheLock) { // Enters if no other instance of the app is running

    try {
      await authService.refreshTokens();
      appWindow = createAppWindow();
    } catch (err) {
      appWindow = createAppWindow();
     
    }
    appWindow.webContents.on('will-navigate', function (event, newUrl) {
      console.log(newUrl);
      if(newUrl.includes("course/"))
      {
        console.log("found course");
        var parsedUrl = newUrl.split('/');
        console.log(parsedUrl);
        console.log("course is "+ parsedUrl[parsedUrl.length-1]);
        var finalURL = `file://${__dirname}/programpage.html?course=${parsedUrl[parsedUrl.length-1]}`;
        console.log(finalURL);
        appWindow.loadURL(finalURL);
      }
      // More complex code to handle tokens goes here
    });
    //Set up main window
    
  } else {
    //Close the app if it is already running
    app.quit();
  }
}

/*app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})*/

app.on('ready', () => {
  // Handle IPC messages from the renderer process.
  ipcMain.handle('auth:get-profile', authService.getProfile);
  ipcMain.handle('api:get-private-data', apiService.getPrivateData);
  ipcMain.handle('api:get-leaderboard', leaderboardservice.getLeaderboard);
  ipcMain.handle('api:get-unity', apiService.getUnity);
  ipcMain.handle('api:set-leaderboard', async (event, someArgument) => {
    const result = await leaderboardservice.sendToLeaderboard(someArgument);
    return result;
  });
  ipcMain.handle('api:set-unity', (event, ins) => {
    apiService.setUnity(ins);
  });
  
  ipcMain.handle('api:reload-main', () => {
    if(appWindow)
    {
        appWindow.webContents.reloadIgnoringCache();
    }
    
  });
  
  ipcMain.on('auth:log-out', () => {
    //BrowserWindow.getAllWindows().forEach(window => window.close());
    createLogoutWindow();
  });
  ipcMain.on('auth:log-in', () => {
    //BrowserWindow.getAllWindows().forEach(window => window.close());
    createLoginWindow();
  });
  createWindow();
  //showWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

function handleSquirrelEvent(application) {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function (command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {
        detached: true
      });
    } catch (error) { }

    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(application.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(application.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      application.quit();
      return true;
  }
};