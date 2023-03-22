const fs = require("fs");

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

function isValidOpenDate(date) {
  date = date.replace(",", "").replace("@", "").split(" ");
  let year = date[2].slice(0, 4);
  let month = date[0];
  let day = date[1];
  if (Date.parse(`${year} ${month} ${day}`))
    return new Date(`${year} ${month} ${day}`);
  else {
    let year = date[6].slice(0, 4);
    let month = date[4];
    let day = date[5];
    return new Date(`${year} ${month} ${day}`);
  }
}
function isValidCloseDate(date) {
  let closedDate = Date.parse(date);
  if (isNaN(closedDate)) {
    return new Date("12/31/2099");
  } else {
    let newClose = new Date(date);
    return newClose.toLocaleDateString();
  }
}

const scraperObject = {
  // The URL of the site being scraped
  url: "https://charlestonwv.gov/bids-purchasing/current-bids",
  site_name: "CharlestonWV",
  async scraper(browser) {
    // Initialize page object and navigate to the url
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    let scrapedData = [];

    // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
    async function scrapeCurrentPage() {
      let titles = await page.$$eval(
        "div.table-responsive > table > tbody > tr > td:nth-child(1)",
        (title) => {
          title = title.map((element) =>
            element.textContent.replace(/\s+/g, " ").trim()
          );
          return title;
        }
      );

      let openDates = await page.$$eval(
        "div.table-responsive > table > tbody > tr > td:nth-child(4)",
        (ods) => {
          ods = ods.map((element) => element.textContent.trim());
          return ods;
        }
      );

      let closeDates = await page.$$eval(
        "div.table-responsive > table > tbody > tr > td:nth-child(5)",
        (cds) => {
          cds = cds.map((element) => element.textContent.trim());
          return cds;
        }
      );
      let descriptions = await page.$$eval(
        "div.table-responsive > table > tbody > tr > td:nth-child(2) > span > span > a",
        (title) => {
          title = title.map((element) =>
            element.href.replace(/\s+/g, " ").trim()
          );
          return title;
        }
      );

      // Iterate over all bid URLs that we scraped earlier.
      for (title in titles) {
        try {
          // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
          let newOpen = new Date(openDates[title]);
          let newClose = new Date(closeDates[title]);
          // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
          scrapedData.push({
            site_name: "CharlestonWV",
            url: "https://charlestonwv.gov/bids-purchasing/current-bids",
            title: titles[title],
            login_required: false,
            payment_required: false,
            open_date: newOpen.toLocaleDateString(),
            open_timestamp: Math.floor(newOpen.getTime() / 1000),
            close_date: newClose.toLocaleDateString(),
            close_timestamp: Math.floor(newClose.getTime() / 1000),
            state: "WV",
            agency: "City of Charleston",
            description: descriptions[title],
          });
          // Write the current scrapedData array to the appropriate "AllData" file.
          fs.writeFile(
            "./0.Scraper2/CharlestonWVAllData.json",
            JSON.stringify(scrapedData),
            "utf8",
            function (err) {
              if (err) {
                return console.log(err);
              }
              console.log(
                "The data has been scraped and saved successfully! View it at '/0.Scraper2/CharlestonWVAllData.json'"
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
