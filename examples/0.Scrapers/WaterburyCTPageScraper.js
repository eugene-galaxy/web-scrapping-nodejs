const fs = require('fs');

// This function sets a delay in milliseconds
function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

// This function checks if a close date is in a valid date format, if it is in valid format it returns the date as a string,
// if it is not it returns the string "12/31/2099"
function isValidDate(date) {
    let closedDate = Date.parse(date)
    if (isNaN(closedDate)) {
        return "12/31/2099"
    } else {
        let newClose = new Date(date);
        return newClose.toLocaleDateString()
    }
}

const scraperObject = {
    // The URL of the site being scraped
    url: ('https://waterburyct.procureware.com/Bids'),
    site_name: 'WaterburyCT',
    async scraper(browser) {
        // Initialize page object and navigate to the url
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url);
        
        // Wait for the status checkboxes to be available, then click on the "Open for Bidding" checkbox so we only see open bids
        await page.waitForSelector('#EnumSelectAdjustedStatus > div.field-editor');
        await page.click('#EnumSelectAdjustedStatus > div.field-editor > div > label:nth-child(1) > input[type=checkbox]');
        // Use delay to wait for the page to update
        await delay(2500);

        let scrapedData = [];

        // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
        async function scrapeCurrentPage() {

            // Wait for content to render.
            await page.waitForSelector('#content-bid_grid > div.toggled-content > div.grid.k-grid.k-widget.k-display-block.k-reorderable > div.k-grid-content.k-auto-scrollable > table > tbody');

            // Select all urls that link directly to individual bids.
            let urls = await page.$$eval('td:nth-child(3) > span > a', links => {
                links = links.map(element => element.href)
                return links;
            });

            console.log(urls);

            // Access the URL on a new page instance and select relevant data.
            let pagePromise = async (link) => {

                // Initalize the new page instance and the data object to store information.
                let dataObj = {};
                let newPage = await browser.newPage();

                // Navigate to the url.
                await newPage.goto(link);
                await delay(2500);

                // Scrape revelant data fields.
                dataObj['Site Name'] = "WaterburyCT";
                dataObj['Title'] = await newPage.$eval('#tb-TextBoxTitle', text => text.textContent);
                dataObj['Open Date'] = await newPage.$eval('#DateTimeDispalyAvailableDate-value', text => text.textContent);
                dataObj['Close Date'] = await newPage.$eval('#DateTimeDispalyDueDate-value', text => text.textContent);
                dataObj['Description'] = await newPage.$eval('#if_bid_viewable-bid_right_tabs > div.tab-content > div > div.aberuntime-containers-workflow > div.workflow-content > div > form > div:nth-child(8) > div > div > div > div > div > div', text => text.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, ""));
                if (dataObj['Description'] === "") {
                    dataObj['Description'] = "Click the 'Link to bid' button below for more information"
                }
                dataObj['Agency'] = 'City of Waterbury'
                dataObj['State'] = "CT";
                
                // Return data object.
                await newPage.close();
                return dataObj;
            };

            // Iterate over all bid URLs that we scraped earlier.
            for (link in urls) {
                try {
                    // Create a new page instance for the individual bid URL to scrape relevant data.
                    let currentPageData = await pagePromise(urls[link]);
                    // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
                    let newOpen = new Date(currentPageData["Open Date"]);
                    let newClose = new Date(isValidDate(currentPageData["Close Date"]));
                    // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
                    scrapedData.push({
                        "site_name": currentPageData["Site Name"],
                        "url": urls[link],
                        "title": currentPageData['Title'],
                        "login_required": true,
                        "payment_required": false,
                        "open_date": newOpen.toLocaleDateString(),
                        "open_timestamp": Math.floor(newOpen.getTime() / 1000),
                        "close_date": newClose.toLocaleDateString(),
                        "close_timestamp": Math.floor(newClose.getTime() / 1000),
                        "state": currentPageData["State"],
                        "agency": currentPageData["Agency"],
                        "description": currentPageData["Description"]
                    });
                    // Write the current scrapedData array to the appropriate "AllData" file.
                    fs.writeFile("./0.Scraper2/WaterburyCTAllData.json", JSON.stringify(scrapedData), 'utf8', function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("The data has been scraped and saved successfully! View it at '/0.Scraper2/WaterburyCTAllDate.json'");
                    });
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
    }
}

module.exports = scraperObject;