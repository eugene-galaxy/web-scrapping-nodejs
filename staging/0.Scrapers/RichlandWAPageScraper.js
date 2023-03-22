const fs = require("fs");

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

function isValidDate(date) {
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
  url: "https://www.ci.richland.wa.us/departments/administrative-services/purchasing/current-bid-opportunities",
  site_name: "RichlandWA",
  async scraper(browser) {
    // Initialize page object and navigate to the url
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    let scrapedData = [];
    //#widget_4_526_1065 > p:nth-child(3) > iframe
    const elementHandle = await page.waitForSelector(
      "div#widget_4_526_1065 > p:nth-child(3) > iframe"
    );
    const contentFrame = await elementHandle.contentFrame();

    // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
    async function scrapeCurrentPage() {
      let urls = [];
      let titles = [];
      let openDates = [];
      let closeDates = [];
      let descriptions = [];
      let rowCount = await contentFrame.$eval(
        "div > table > tbody",
        (element) => element.childElementCount
      );
      for (let i = 1; i <= rowCount; i++) {
        let url = await contentFrame.$eval(
          `tr:nth-child(${i}) > td:nth-child(1) > a`,
          (element) => element.href
        );
        let arrTitle = await contentFrame.$$eval(
          `tr:nth-child(${i}) > td:nth-child(1) > a > span:not([style="display: none;"])`,
          (subs) => {
            subs = subs.map((element) => element.textContent);
            return subs;
          }
        );
        let title = arrTitle.join("");
        let arrOpen = await contentFrame.$$eval(
          `tr:nth-child(${i}) > td:nth-child(2) > span:not([style="display: none;"])`,
          (subs) => {
            subs = subs.map((element) => element.textContent);
            return subs;
          }
        );
        let open = arrOpen.join("");

        let arrClose = await contentFrame.$$eval(
          `tr:nth-child(${i}) > td:nth-child(3) > span:not([style="display: none;"])`,
          (subs) => {
            subs = subs.map((element) => element.textContent);
            return subs;
          }
        );
        let close = arrClose.join("");

        let arrDescription = await contentFrame.$$eval(
          `tr:nth-child(${i}) > td:nth-child(1) > div > span:not([style="display: none;"])`,
          (subs) => {
            subs = subs.map((element) => element.textContent);
            return subs;
          }
        );
        let description = arrDescription.join("");
        titles.push(title);
        urls.push(url);
        openDates.push(open);
        closeDates.push(close);
        descriptions.push(description);
      }

      for (title in titles) {
        try {
          // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
          let newOpen = new Date(openDates[title]);
          let newClose = new Date(closeDates[title]);
          // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
          scrapedData.push({
            site_name: "RichlandWA",
            url: urls[title],
            title: titles[title],
            login_required: true,
            payment_required: false,
            open_date: newOpen.toLocaleDateString(),
            open_timestamp: Math.floor(newOpen.getTime() / 1000),
            close_date: newClose.toLocaleDateString(),
            close_timestamp: Math.floor(newClose.getTime() / 1000),
            state: "LA",
            agency: "City of Monroe",
            description: descriptions[title],
          });
          // Write the current scrapedData array to the appropriate "AllData" file.
          fs.writeFile(
            "./0.Scraper2/RichlandWAAllData.json",
            JSON.stringify(scrapedData),
            "utf8",
            function (err) {
              if (err) {
                return console.log(err);
              }
              console.log(
                "The data has been scraped and saved successfully! View it at '/0.Scraper2/RichlandWAAllData.json'"
              );
            }
          );
        } catch (e) {
          console.log(e);
        }
      }
      await page.close();
      return scrapedData;
    }
    // Iterate over all bid URLs that we scraped earlier.
    let data = await scrapeCurrentPage();
    console.log(data);
    return data;
  },
};

module.exports = scraperObject;
