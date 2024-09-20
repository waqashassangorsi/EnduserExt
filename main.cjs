const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // If using nodeIntegration, otherwise use preload.js
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
});
