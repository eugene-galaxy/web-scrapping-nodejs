// This is an early version of a concurrent scraper program that will allow us to run
// multiple website scrapers in parallel.

// Import dependencies
const puppeteer = require('puppeteer');
const fs = require('fs');

// Dynamically import the scrapers inside of  './0.Scrapers'
var normalizedPath = require("path").join(__dirname, "0.Scrapers");

// Load the export objects into an array for referencing
let scrapers = [];

fs.readdirSync(normalizedPath).forEach(function (file) {
  scrapers.push(require("./0.Scrapers/" + file));
});

// Run the scrapers!
let errors = [];
errors.push({ "Run Date": new Date().toLocaleDateString() });

(async () => {

  // Run each scraper
  for await (const scraper of scrapers) {

    // Initialize a browser instance for the scrapers to run off of
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox',
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
      // Run the scraper method in each scraper file
      await scraper.scraper(browser).catch(error => {
        errors.push({
          "Error Name": error.name,
          "Scraper URL": scraper.url !== null ? scraper.url : "No URL provided for this scraper",
          "Error Location": "Consumer Catch",
          "Error Message": error.message,
          "Location": error.fileName,
          "Line Number": error.lineNumber,
          "Stack Trace": error.stack.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim()
        });
      });

    } catch (error) {

      errors.push({
        "Error Name": error.name,
        "Scraper URL": scraper.url !== null ? scraper.url : "No URL provided for this scraper",
        "Error Location": "try-catch",
        "Error Message": error.message,
        "Location": error.fileName,
        "Line Number": error.lineNumber,
        "Stack Trace": error.stack.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim()
      });

    } finally {
      await browser.close();
    }
  }

  return 1;
})().then(async () => {

  // Write errors after all scrapers have ran.
  if (errors.length > 1) {
    fs.writeFile("log.json", JSON.stringify(errors), 'utf8', function (err) {
      if (err) {
        return console.log(err);
      }
      console.log(errors.length - 1 + " errors have occured. Please see log.json");
    });
  }
});