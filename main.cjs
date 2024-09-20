const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const puppeteer = require('puppeteer-core');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Use dynamic import() for GoLogin
ipcMain.on('run-gologin-code', async (event, data) => {
  const token = data.token;
  const profile_id = data.profile_id;

  // Dynamically import GoLogin since it's an ES module
  const GoLogin = (await import('./src/gologin.js')).default;

  const GL = new GoLogin({
    token,
    profile_id,
  });

  try {
    const { status, wsUrl } = await GL.start();

    if (status !== 'success') {
      console.log('Invalid status');
      return;
    }

    const browser = await puppeteer.connect({
      browserWSEndpoint: wsUrl.toString(),
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto('https://www.gov.uk/book-driving-test', {
      waitUntil: 'networkidle0',
    });

    await page.waitForSelector('#get-started');
    await page.evaluate(() => {
      const getStartedElement = document.querySelector('#get-started');
      const firstAnchor = getStartedElement.querySelector('a');
      if (firstAnchor) {
        firstAnchor.click();
      }
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    console.log('Puppeteer task complete');

    // Optionally close the browser and stop GoLogin session
    // await browser.close();
    // await GL.stop();

  } catch (error) {
    console.error('Error in GoLogin task:', error);
  }
});
