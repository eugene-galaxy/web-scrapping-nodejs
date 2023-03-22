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
      // Select all bid titles that are available on this page.
      let pageCount = await contentFrame.$eval(
        "span.ui-paginator-pages",
        (element) => element.childElementCount
      );
      // Access the URL on a new page instance and select relevant data.
      let pagePromise = async (link) => {
        // Initalize the new page instance and the data object to store information.
        let dataObj = {};
        let newPage = await browser.newPage();
        await newPage.goto(link);

        // Scrape revelant data fields.
        dataObj["Title"] = await newPage.$eval(
          "#bidDetailPage > div.multiContentBoxNoBorder.bidDetailContentBox > div",
          (text) => text.textContent
        );
        dataObj["Site Name"] = "SarasotaCoFL";
        try {
          dataObj["Open Date"] = await newPage.$eval(
            "#bidDetailPage > div.multiContentBoxNoBorder.bidDetailContentBox > span:nth-child(7)",
            (text) =>
              text.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, "")
          );
        } catch {
          dataObj["Open Date"] = await newPage.$eval(
            "ul.detail-list > li:nth-child(2) > span:nth-child(2)",
            (text) =>
              text.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, "")
          );
        }
        try {
          dataObj["Close Date"] = await newPage.$eval(
            "#bidDetailPage > div.multiContentBoxNoBorder.bidDetailContentBox > span:nth-child(10)",
            (text) =>
              text.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, "")
          );
        } catch {
          dataObj["Close Date"] = await newPage.$eval(
            "ul.detail-list > li:nth-child(3) > span:nth-child(2)",
            (text) =>
              text.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, "")
          );
        }
        dataObj["State"] = "FL";
        dataObj["Agency"] = "Sarasota County";
        let description = await newPage.$$eval(
          "div.centerText.clear > table:nth-child(1) > tbody > tr:nth-child(4) > td.tableColumnPadding.leftText > div",
          (text) => {
            text = text.map((element) =>
              element.textContent.replace(/\s+/g, " ").trim()
            );
            return text;
          }
        );
        dataObj["Description"] = description.join(" ");

        // Return data object.
        await newPage.close();
        return dataObj;
      };
      for (let i = 1; i <= pageCount; i++) {
        console.log(i);
        await contentFrame.click(`div.ui-paginator > span.ui-paginator-next`);
        let urls = await contentFrame.$$eval(
          "table > tbody > tr > td > div > div > a",
          (link) => {
            link = link.map((element) => element.href);
            return link;
          }
        );
        console.log(urls);
        // for (link in urls) {
        //   try {
        //     // Create a new page instance for the individual bid URL to scrape relevant data.
        //     let currentPageData = await pagePromise(urls[link]);
        //     // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
        //     let newOpen = new Date(currentPageData["Open Date"]);
        //     let newClose = new Date(currentPageData["Close Date"]);
        //     // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
        //     scrapedData.push({
        //       site_name: currentPageData["Site Name"],
        //       url: urls[link],
        //       title: currentPageData["Title"],
        //       login_required: false,
        //       payment_required: false,
        //       open_date: newOpen.toLocaleDateString(),
        //       open_timestamp: Math.floor(newOpen.getTime() / 1000),
        //       close_date: newClose.toLocaleDateString(),
        //       close_timestamp: Math.floor(newClose.getTime() / 1000),
        //       state: currentPageData["State"],
        //       agency: currentPageData["Agency"],
        //       description: currentPageData["Description"],
        //     });
        //     // Write the current scrapedData array to the appropriate "AllData" file.
        //     fs.writeFile(
        //       "0.Scraper2/SarasotaCoFLAllData.json",
        //       JSON.stringify(scrapedData),
        //       "utf8",
        //       function (err) {
        //         if (err) {
        //           return console.log(err);
        //         }
        //         console.log(
        //           "The data has been scraped and saved successfully! View it at '0.Scraper2/SarasotaCoFLAllData.json'"
        //         );
        //       }
        //     );
        //   } catch (e) {
        //     console.log(e);
        //   }
        // }
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
