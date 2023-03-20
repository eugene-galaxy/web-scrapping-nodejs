// This is an early version of a concurrent scraper program that will allow us to run
// multiple website scrapers in parallel.

// Import dependencies
const puppeteer = require('puppeteer');
const bluebird = require('bluebird');
const fs = require('fs');
const path = require("path");

// Dynamically import the scrapers inside of  './0.Scrapers'
var normalizedPath = require("path").join(__dirname, "0.Scrapers");

// Load the export objects into an array for referencing
let scrapers = [];

fs.readdirSync(normalizedPath).forEach(function (file) {
  scrapers.push(require("./0.Scrapers/" + file));
});

// Initialize a browser instance for the scrapers to run off of
const withBrowser = async (fn) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [ '--no-sandbox',
      "--disable-setuid-sandbox",
      "--window-size=1920,1080",
      "--disable-gpu",
      "--single-process",
      "--disable-accelerated-2d-canvas",
      "--ingore-certificate-errors"],
    defaultViewport: null,
    ignoreHTTPSErrors: false
  });

  try {
    return await fn(browser);
  } catch (err) {
    console.log(err);
  } finally {
    await browser.close();
  }
}

// Run the scrapers!
let errors = [];
errors.push({ "Run Date": new Date().toLocaleDateString() });

withBrowser(async (browser) => {
  return bluebird.map(scrapers, async (scraper) => {
    // Attempt to execute scraper, catch errors
    return await scraper.scraper(browser).catch(error => {
      errors.push({
        "Error Name": error.name,
        "Error Location": "Consumer Catch",
        "Error Message": error.message,
        "Location": error.fileName,
        "Line Number": error.lineNumber,
        "Stack Trace": error.stack.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim()
      })
    });
  }, { concurrency: 1 });
}).then(async () => {

  if (errors.length > 1) {
    fs.writeFile("log.json", JSON.stringify(errors), 'utf8', function (err) {
      if (err) {
        return console.log(err);
      }
      console.log(errors.length - 1 + " errors have occured. Please see log.json");
    });
  }
})