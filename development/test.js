const fs = require("fs");

// This function sets a delay in milliseconds
function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

const scraperObject = {
  // The URL of the site being scraped
  url: "https://www.scgov.net/government/financial-management/other-documents/procurement",
  site_name: "SarasotaCoFL",
  async scraper(browser) {
    // Initialize page object and navigate to the url
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    let scrapedData = [];

    const elementHandle = await page.waitForSelector(
      "div#widget_5768_630_1026 > div > iframe"
    );
    const contentFrame = await elementHandle.contentFrame();
    // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
    async function scrapeCurrentPage() {
      let urls = [];
      let titles = [];
      let closeDates = [];
      let getCurrentData = async () => {
        await contentFrame.waitForSelector("table > tbody");

        urls = urls.concat(
          await contentFrame.$$eval(
            "td:nth-child(2) > div > div:nth-child(1) > a",
            (link) => {
              link = link.map((element) => element.href);
              return link;
            }
          )
        );
      };
      let pageCount = await contentFrame.$eval(
        ".ui-paginator-pages",
        (element) => element.childElementCount
      );
      await getCurrentData();
      for (i = 1; i < pageCount; i++) {
        await contentFrame.click(".ui-paginator-next");
        await delay(1000);
        await getCurrentData();
      }

      console.log(urls.length);
      console.log(urls);

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
