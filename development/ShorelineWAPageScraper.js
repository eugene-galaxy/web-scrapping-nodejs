const fs = require("fs");

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
function isValidOpenDate(date) {
  let openDate = Date.parse(date);
  if (isNaN(openDate)) {
    let openDate = new Date();
    return openDate.toLocaleDateString();
  } else {
    let openDate = new Date(date);
    return openDate.toLocaleDateString();
  }
}
function isValidCloseDate(date) {
  date = date.split(" ");
  if (date[7].indexOf(",") >= 0) {
    let month = date[5].replace(",", "");
    let day = date[6].replace(",", "");
    let year = date[7].replace(",", "");
    date = new Date(`${year} ${month} ${day}`);
  }
  let closedDate = Date.parse(date);
  if (isNaN(closedDate)) {
    let month = date[4].replace(",", "");
    let day = date[5];
    let year = date[6];
    let newClose = new Date(`${year} ${month} ${day}`);
    return newClose.toLocaleDateString();
  } else {
    let newClose = new Date(date);
    return newClose.toLocaleDateString();
  }
}

const scraperObject = {
  // The URL of the site being scraped
  url: "https://www.shorelinewa.gov/government/departments/administrative-services/bids-rfps",
  site_name: "ShorelineWA",
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
        "div#widget_4_582_236",
        (element) => element.childElementCount
      );
      let titles = [];
      let openDates = [];
      let closeDates = [];
      let description = [];
      for (let i = 1; i < rowCount - 1; i++) {
        //table > tbody > tr:nth-child(${i}) > td:nth-child(3)) > b
        try {
          titles.push(
            await page.$eval(
              `div#widget_4_582_236 > p:nth-child(${i}) > a:nth-child(1)`,
              (element) => element.textContent
            )
          );
        } catch {
          titles.push(
            await page.$eval(
              `div#widget_4_582_236 > p:nth-child(${i}) > strong > a`,
              (element) => element.textContent
            )
          );
        }
        description.push("");
        closeDates.push(
          await page.$eval(
            `div#widget_4_582_236 > p:nth-child(${i}) > br:last-child`,
            (element) =>
              element.nextSibling.textContent.replace(/\s+/g, " ").trim()
          )
        );
      }
      for (title in titles) {
        try {
          // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
          let newOpen = new Date(isValidOpenDate(openDates[title]));
          let newClose = new Date(isValidCloseDate(closeDates[title]));
          console.log(closeDates[title]);
          // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
          scrapedData.push({
            site_name: "ShorelineWA",
            url: "https://www.shorelinewa.gov/government/departments/administrative-services/bids-rfps",
            title: titles[title],
            login_required: false,
            payment_required: false,
            open_date: newOpen.toLocaleDateString(),
            open_timestamp: Math.floor(newOpen.getTime() / 1000),
            close_date: newClose.toLocaleDateString(),
            close_timestamp: Math.floor(newClose.getTime() / 1000),
            state: "WA",
            agency: "City of Shoreline",
            description: description[title],
          });
          // Write the current scrapedData array to the appropriate "AllData" file.
          fs.writeFile(
            "./0.Scraper2/ShorelineWAAllData.json",
            JSON.stringify(scrapedData),
            "utf8",
            function (err) {
              if (err) {
                return console.log(err);
              }
              console.log(
                "The data has been scraped and saved successfully! View it at '/0.Scraper2/ShorelineWAAllData.json'"
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
