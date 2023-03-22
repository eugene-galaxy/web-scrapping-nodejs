const fs = require("fs");

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
function isValidDate(dateString) {
  const dateArray = dateString.split(" ");
  const month = dateArray[1];
  const day = dateArray[2].replace(",", "");
  const year = dateArray[3];
  const date = new Date(`${month} ${day}, ${year}`);
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
  url: "https://www.seattlehousing.org/do-business-with-us/solicitations",
  site_name: "SHAWA",
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
      await page.select(`select#edit-field-solicitation-status-value`, "Open");
      await delay(1000);
      while (
        await page
          .waitForSelector("ul.pager > li.pager__item > a", { timeout: 2000 })
          .catch(() => null)
      ) {
        // Click on the button
        await page.click("ul.pager > li.pager__item > a");
      }
      let urls = await page.$$eval(
        "div.view-content > div > div > span > a",
        (link) => {
          link = link.map((element) => element.href);
          return link;
        }
      );
      // Access the URL on a new page instance and select relevant data.
      let pagePromise = async (link) => {
        // Initalize the new page instance and the data object to store information.
        let dataObj = {};
        let newPage = await browser.newPage();
        await newPage.goto(link);

        // Scrape revelant data fields.
        dataObj["Title"] = await newPage.$eval(
          "body > div.l-page > div.l-main > div > div > h1",
          (text) => text.textContent
        );
        dataObj["Site Name"] = "SHAWA";
        dataObj["Open Date"] = await newPage.$eval(
          "div.node__content > div:nth-child(3) > div > div > span",
          (text) =>
            text.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, "")
        );
        dataObj["Close Date"] = await newPage.$eval(
          "div.node__content > div:nth-child(4) > div > div > span",
          (text) =>
            text.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, "")
        );
        dataObj["State"] = "WA";
        dataObj["Agency"] = "Seattle Housing Authority (SHA)";
        let description = await newPage.$eval(
          "div.node__content > div:nth-child(7) > div.field__items > div",
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
          let newOpen = new Date(currentPageData["Open Date"]);
          let newClose = new Date(isValidDate(currentPageData["Close Date"]));
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
            "0.Scraper2/SHAWAAllData.json",
            JSON.stringify(scrapedData),
            "utf8",
            function (err) {
              if (err) {
                return console.log(err);
              }
              console.log(
                "The data has been scraped and saved successfully! View it at '0.Scraper2/SHAWAAllData.json'"
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
