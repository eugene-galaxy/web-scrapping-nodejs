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
  url: "https://www.marionschools.net/pur",
  site_name: "MarionCoPSFL",
  async scraper(browser) {
    // Initialize page object and navigate to the url
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    let scrapedData = [];

    // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
    async function scrapeCurrentPage() {
      // Wait for content to render.
      let rowCount = await page.$eval(
        "div.ui-widget.app.announcements > div.ui-widget-detail > ul.ui-articles",
        (element) => element.childElementCount
      );
      let titles = [];
      let openDates = [];
      let closeDates = [];
      let description = [];
      for (let i = 2; i <= rowCount; i++) {
        titles.push(
          await page.$eval(
            `div.ui-widget.app.announcements > div.ui-widget-detail > ul.ui-articles > li:nth-child(${i}) > div > div > span > p:nth-child(1)`,
            (element) => element.textContent
          )
        );
        description.push(
          await page.$eval(
            `div.ui-widget.app.announcements > div.ui-widget-detail > ul.ui-articles > li:nth-child(${i}) > div > div > span > p:nth-child(3)`,
            (element) => element.textContent
          )
        );

        let openDate = await page.$eval(
          `div.ui-widget.app.announcements > div.ui-widget-detail > ul.ui-articles > li:nth-child(${i}) > div > div > span > p:nth-child(2)`,
          (element) =>
            element.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, "")
        );
        let tmp = await page.$eval(
          `div.ui-widget.app.announcements > div.ui-widget-detail > ul.ui-articles > li:nth-child(${i}) > div > div > span > p:nth-child(2) > strong`,
          (element) =>
            element.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, "")
        );
        openDates.push(openDate.slice(tmp.length));
      }
      for (title in titles) {
        try {
          // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
          let newOpen = new Date(openDates[title]);
          let newClose = new Date(isValidDate(closeDates[title]));
          // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
          scrapedData.push({
            site_name: "MarionCoPSFL",
            url: "https://www.marionschools.net/pur",
            title: titles[title],
            login_required: false,
            payment_required: false,
            open_date: newOpen.toLocaleDateString(),
            open_timestamp: Math.floor(newOpen.getTime() / 1000),
            close_date: newClose.toLocaleDateString(),
            close_timestamp: Math.floor(newClose.getTime() / 1000),
            state: "FL",
            agency: "Marion County Public Schools",
            description: description[title],
          });
          // Write the current scrapedData array to the appropriate "AllData" file.
          fs.writeFile(
            "./0.Scraper2/MarionCoPSFLAllData.json",
            JSON.stringify(scrapedData),
            "utf8",
            function (err) {
              if (err) {
                return console.log(err);
              }
              console.log(
                "The data has been scraped and saved successfully! View it at '/0.Scraper2/MarionCoPSFLAllData.json'"
              );
            }
          );
        } catch (e) {
          console.log(e);
        }
        await delay(10);
      }
      await page.close();
      return scrapedData;
    }
    let data = await scrapeCurrentPage();
    console.log(data);
    return data;
  },
};

module.exports = scraperObject;
