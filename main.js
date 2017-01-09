const electron = require('electron');
const ipc = electron.ipcMain;
// Module to control application life.
const app = electron.app;
const net = electron.net;
const shell = electron.shell;
const Menu = electron.Menu;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const defaultMenu = require('electron-default-menu');


const path = require('path');
const url = require('url');
const crypto = require('crypto');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const menu = defaultMenu(app, shell);
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function hash(contents) {
  return crypto.createHash('sha1').update(contents).digest('hex');
}
function request(requestUrl) {
  return new Promise(resolve => {
    const req = net.request(requestUrl);
    req.on('response', (res) => {
      let buffer = [];
      res.on('data', d => buffer.push(d));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          result: hash(buffer.join(''))
        });
      });
      res.on('error', (err) => {
        console.log(err);

        resolve({
          status: 0,
          result: 'Error'
        });
      });
    });
    req.on('error', (err) => {
      console.log(err);

      resolve({
        status: 0,
        result: 'Error'
      });
    });
    req.end();
  });
}


ipc.on('url', (event, requestId, requestUrl) => {
  request(requestUrl).then(msg => event.sender.send(requestId, msg));
});