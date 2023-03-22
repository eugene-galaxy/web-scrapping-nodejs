const fs = require("fs");

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
function isValidDate(date) {
  let closedDate = Date.parse(date);
  if (isNaN(closedDate)) {
    let newClose = new Date();
    return newClose.toLocaleDateString();
  } else {
    let newClose = new Date(date);
    return newClose.toLocaleDateString();
  }
}
const scraperObject = {
  // The URL of the site being scraped
  url: "https://www.portoftacoma.com/business/contracting/procurement",
  site_name: "TacomaPortWA",
  async scraper(browser) {
    // Initialize page object and navigate to the url
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    let scrapedData = [];
    // await page.focus(`div.form-radios > ul > li:nth-child(3) > div > label`);

    // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
    async function scrapeCurrentPage() {
      // Wait for content to render.

      // Select all bid titles that are available on this page.
      await page.click(`div.form-radios > ul > li:nth-child(3) > div > label`);
      await page.click(`div.form-actions > input:nth-child(1)`);
      await delay(2000);
      let urls = await page.$$eval("table > tbody > tr > td > a", (link) => {
        link = link.map((element) => element.href);
        return link;
      });
      // Access the URL on a new page instance and select relevant data.
      let pagePromise = async (link) => {
        // Initalize the new page instance and the data object to store information.
        let dataObj = {};
        let newPage = await browser.newPage();
        await newPage.goto(link);

        // Scrape revelant data fields.
        dataObj["Title"] = await newPage.$eval(
          "div.layout-container > main > div > h2",
          (text) => text.textContent
        );
        dataObj["Site Name"] = "TacomaPortWA";
        dataObj["Close Date"] = await newPage.evaluate(() => {
          const timeTag = document.querySelector("time");
          return timeTag.getAttribute("datetime");
        });
        dataObj["State"] = "WA";
        dataObj["Agency"] = "Port of Tacoma";
        let description = await newPage.$eval(
          "div#block-pota-content > article > div:nth-child(1) > div:nth-child(2) > div.proc-detail__field",
          (text) => text.textContent.replace(/\s+/g, " ").trim()
        );
        if (description.length < 50)
          description = await newPage.$eval(
            "div#block-pota-content > article > div:nth-child(1) > div:nth-child(3) > div.proc-detail__field",
            (text) => text.textContent.replace(/\s+/g, " ").trim()
          );
        dataObj["Description"] = description;

        // Return data object.
        await newPage.close();
        return dataObj;
      };

      for (link in urls) {
        try {
          // Create a new page instance for the individual bid URL to scrape relevant data.
          let currentPageData = await pagePromise(urls[link]);
          // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
          let newOpen = new Date(isValidDate(currentPageData["Open Date"]));
          let newClose = new Date(currentPageData["Close Date"]);
          // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
          scrapedData.push({
            site_name: currentPageData["Site Name"],
            url: urls[link],
            title: currentPageData["Title"],
            login_required: false,
            payment_required: false,
            open_date: newOpen.toLocaleDateString(),
            open_timestamp: Math.floor(newOpen.getTime() / 1000),
            close_date: newClose.toLocaleDateString(),
            close_timestamp: Math.floor(newClose.getTime() / 1000),
            state: currentPageData["State"],
            agency: currentPageData["Agency"],
            description: currentPageData["Description"],
          });
          // Write the current scrapedData array to the appropriate "AllData" file.
          fs.writeFile(
            "0.Scraper2/TacomaPortWAAllData.json",
            JSON.stringify(scrapedData),
            "utf8",
            function (err) {
              if (err) {
                return console.log(err);
              }
              console.log(
                "The data has been scraped and saved successfully! View it at '0.Scraper2/TacomaPortWAAllData.json'"
              );
            }
          );
        } catch (e) {
          console.log(e);
        }
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
