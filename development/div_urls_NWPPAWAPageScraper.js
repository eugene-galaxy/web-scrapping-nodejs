const fs = require("fs");

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
const scraperObject = {
  // The URL of the site being scraped
  url: "https://www.nwppa.org/rfps-rfqs-2/",
  site_name: "NWPPAWA",
  async scraper(browser) {
    // Initialize page object and navigate to the url
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    let scrapedData = [];

    // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
    async function scrapeCurrentPage() {
      // Wait for content to render.

      // Select all bid titles that are available on this page.
      let urls = await page.$$eval(
        "#content > article > div > div.elementor.elementor-273 > div > div > section > div > div > div > div > div > div > div > div > article > a:nth-child(1)",
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
          "#main > header > div > h1",
          (text) => text.textContent
        );
        dataObj["Site Name"] = "NWPPAWA";
        dataObj["Open Date"] = await newPage.evaluate(() => {
          const timeTag = document.querySelector("time");
          return timeTag.getAttribute("datetime");
        });
        // dataObj["Close Date"] = await newPage.$eval(
        //   "#right-sidebar > div > div.job-overview > ul > li:nth-child(4) > div > span",
        //   (text) =>
        //     text.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, "")
        // );
        dataObj["Close Date"] = await newPage.$eval(
          "#right-sidebar > div > div.job-overview > ul > li:nth-child(4) > div > span > br",
          (node) => node.previousSibling.textContent.trim()
        );
        dataObj["State"] = "WA";
        dataObj["Agency"] = "Northwest Public Power Association";
        let description = await newPage.$eval("div.entry-content.clr", (text) =>
          text.textContent.replace(/\s+/g, " ").trim()
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
            description: currentPageData["Description"].slice(34),
          });
          // Write the current scrapedData array to the appropriate "AllData" file.
          fs.writeFile(
            "0.Scraper2/NWPPAWAAllData.json",
            JSON.stringify(scrapedData),
            "utf8",
            function (err) {
              if (err) {
                return console.log(err);
              }
              console.log(
                "The data has been scraped and saved successfully! View it at '0.Scraper2/NWPPAWAAllData.json'"
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
