const fs = require("fs");

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
function isValidOpenDate(date) {
  let openDate = Date.parse(date);
  if (isNaN(openDate)) {
    let newOpen = new Date();
    return newOpen.toLocaleDateString();
  } else {
    let newClose = new Date(openDate);
    return newClose.toLocaleDateString();
  }
}
function isValidCloseDate(date) {
  let closedDate = Date.parse(date);
  if (isNaN(closedDate)) {
    return "12/31/2099";
  } else {
    let newClose = new Date(date);
    return newClose.toLocaleDateString();
  }
}
const scraperObject = {
  // The URL of the site being scraped
  url: "https://www.browncountywi.gov/departments/administration/purchasing/open-projects/",
  site_name: "BrownCoWI",
  async scraper(browser) {
    // Initialize page object and navigate to the url
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    let scrapedData = [];

    // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
    async function scrapeCurrentPage() {
      let descriptions = [];
      let openDates = [];
      let closeDates = [];
      let titles = await page.$$eval("div.page-doc", (divs) => {
        divs = divs.map((element) => {
          if (element.textContent.includes("*******")) {
            return element.nextElementSibling.textContent;
          }
        });
        return divs;
      });
      titles = titles.filter((element) => element !== null);
      titles.pop();
      for (title in titles) {
        try {
          // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
          let newOpen = new Date(isValidOpenDate(openDates[title]));
          let newClose = new Date(isValidCloseDate(closeDates[title]));
          // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
          scrapedData.push({
            url: "https://www.browncountywi.gov/departments/administration/purchasing/open-projects/",
            site_name: "BrownCoWI",
            title: titles[title],
            login_required: false,
            payment_required: false,
            open_date: newOpen.toLocaleDateString(),
            open_timestamp: Math.floor(newOpen.getTime() / 1000),
            close_date: newClose.toLocaleDateString(),
            close_timestamp: Math.floor(newClose.getTime() / 1000),
            state: "WI",
            agency: "Brown County",
            description:
              "Click the “Link to bid” below button for more information",
          });
          // Write the current scrapedData array to the appropriate "AllData" file.
          fs.writeFile(
            "./0.Scraper2/BrownCoWIAllData.json",
            JSON.stringify(scrapedData),
            "utf8",
            function (err) {
              if (err) {
                return console.log(err);
              }
              console.log(
                "The data has been scraped and saved successfully! View it at '/0.Scraper2/BrownCoWIAllData.json'"
              );
            }
          );
        } catch (e) {
          console.log(e);
        }
        await delay(10);
      }
      // We are done scraping this page, return scrapedData.
      await page.close();
      return scrapedData;
    }
    let data = await scrapeCurrentPage();
    console.log(data);
    return data;
  },
};

module.exports = scraperObject;
