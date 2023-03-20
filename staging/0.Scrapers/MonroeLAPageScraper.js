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
  url: "https://qap.questcdn.com/qap/projects/prj_browse/ipp_browse_grid.html?projType=all&provider=6595685&group=6595685",
  site_name: "MonroeLA",
  async scraper(browser) {
    // Initialize page object and navigate to the url
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    let scrapedData = [];

    // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
    async function scrapeCurrentPage() {
      await page.waitForSelector(
        "table#table_id tbody td:nth-child(4) > div > a"
      );

      let titles = await page.$$eval(
        "#table_id tbody td:nth-child(4) > div > a",
        (title) => {
          title = title.map((element) => element.textContent);
          return title;
        }
      );

      let openDates = await page.$$eval(
        "#table_id tbody td:nth-child(1)",
        (ods) => {
          ods = ods.map((element) => element.textContent.trim());
          return ods;
        }
      );

      let closeDates = await page.$$eval(
        "#table_id tbody td:nth-child(5)",
        (cds) => {
          cds = cds.map((element) => element.textContent.trim());
          return cds;
        }
      );
      let descriptions = [];
      for (i = 1; i < titles.length + 1; i++) {
        let newPage = await browser.newPage();
        await newPage.goto(
          "https://qap.questcdn.com/qap/projects/prj_browse/ipp_browse_grid.html?projType=all&provider=6595685&group=6595685"
        );
        await newPage.waitForSelector(
          "table#table_id tbody td:nth-child(4) > div > a"
        );
        await newPage.evaluate(
          `document.querySelector('#table_id tbody > tr:nth-child(${i}) > td:nth-child(4) > div > a').click()`
        );
        await delay(1000);
        await newPage.waitForSelector("#current_project div.col-sm-8");
        try {
          descriptions.push(
            await newPage.$eval(
              "#current_project > div > div:nth-child(3) > div.panel > table > tbody > tr:nth-child(3) > td:nth-child(2)",
              (element) =>
                element.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, "")
            )
          );
        } catch {
          descriptions.push(
            await newPage.$eval(
              "#current_project > div > div:nth-child(3) > div.panel > table > tbody > tr:nth-child(3) > td:nth-child(2)",
              (element) =>
                element.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, "")
            )
          );
        }
        await newPage.close();
      }
      // Iterate over all bid URLs that we scraped earlier.
      for (title in titles) {
        try {
          // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
          let newOpen = new Date(openDates[title]);
          let newClose = new Date(closeDates[title]);
          // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
          scrapedData.push({
            site_name: "MonroeLA",
            url: "https://qap.questcdn.com/qap/projects/prj_browse/ipp_browse_grid.html?projType=all&provider=6595685&group=6595685",
            title: titles[title],
            login_required: false,
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
            "./0.Scraper2/MonroeLAAllData.json",
            JSON.stringify(scrapedData),
            "utf8",
            function (err) {
              if (err) {
                return console.log(err);
              }
              console.log(
                "The data has been scraped and saved successfully! View it at '/0.Scraper2/MonroeLAAllData.json'"
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
