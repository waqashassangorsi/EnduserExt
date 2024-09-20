const { ipcMain } = require("electron");
import puppeteer from "puppeteer-core";
import GoLogin from "./src/gologin.js";

ipcMain.on("run-gologin-code", async (event, data) => {
  const token = data.token;
  const profile_id = data.profile_id;

  const GL = new GoLogin({
    token,
    profile_id,
  });

  const { status, wsUrl } = await GL.start().catch((e) => {
    console.trace(e);
    return { status: "failure" };
  });

  if (status !== "success") {
    console.log("Invalid status");
    return;
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl.toString(),
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.goto("https://www.gov.uk/book-driving-test", {
    waitUntil: "networkidle0",
  });

  // Wait for the element with the ID 'get-started' to appear
  await page.waitForSelector("#get-started");

  // Click the first anchor tag inside the 'get-started' element
  await page.evaluate(() => {
    const getStartedElement = document.querySelector("#get-started");
    const firstAnchor = getStartedElement.querySelector("a");
    if (firstAnchor) {
      firstAnchor.click();
    }
  });

  // Optional: Wait for some navigation or actions to complete after the click
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  console.log("Puppeteer task complete");

  // Optional: Close browser and stop GoLogin session
  // await browser.close();
  // await GL.stop();
});
