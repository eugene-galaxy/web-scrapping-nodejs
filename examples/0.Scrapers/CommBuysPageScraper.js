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
    url: ('https://www.commbuys.com/bso/view/search/external/advancedSearchBid.xhtml'),
    site_name: 'CommBuys',
    async scraper(browser) {
        // Initialize page object and navigate to the url.
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.setViewport({
            width: 1920,
            height: 1080
        });
        await page.goto(this.url);
        await page.waitForSelector('#bidSearchForm');

        // Get todays date and subtract 1 day to get yesterdays date
        let fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 1);
        fromDate = fromDate.toLocaleDateString("en-029", { day: "2-digit", month: "2-digit", year: "numeric" });

        // Populate "Opening Date From" with yesterdays date
        await page.click('#bidSearchForm > div:nth-child(9) > div:nth-child(2) > span > input')
        await page.type('#bidSearchForm > div:nth-child(9) > div:nth-child(2) > span > input', fromDate, { delay: 50 })

        // Populate "Opening Date To" with 01/01/2099
        await page.click('#bidSearchForm > div:nth-child(9) > div:nth-child(3) > span > input')
        await page.type('#bidSearchForm > div:nth-child(9) > div:nth-child(3) > span > input', "01/01/2099", { delay: 50 })

        // Click the search button
        const searchButton = await page.$('#bidSearchForm > div:nth-child(14) > div > button');
        await searchButton.click();

        // Initalize structures to hold scraped information.
        let scrapedData = [];
        let scrapedLinks = [];

        // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
        async function scrapeCurrentPage() {

            // Wait for content to render.
            await page.waitForSelector('#bidSearchResultsForm');

            // Select all urls that link directly to individual bids.
            let urls = await page.$$eval('td:nth-child(1) > a', links => {
                links = links.map(element => element.href)
                return links;
            });

            // Splice the last 4 elements of the url array due to 4 unwanted links getting picked up
            urls.splice(-4);
            console.log(urls);
            console.log(urls.length);

            // Append URLs on each scraped page to an object containing all URLs
            scrapedLinks = scrapedLinks.concat(urls);

            // Access the URL on a new page instance and select relevant data.
            let pagePromise = async (link) => {
                // Initalize the new page isntance and the data object to store information.
                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link);

                // Check to see if the website threw a back-end error when trying to access the bid
                let error = await newPage.$('body > div > table:nth-child(5) > tbody > tr:nth-child(1) > td > table:nth-child(1) > tbody > tr > td');
                if (error === null) {
                    // Populate the required data fields with any relevant data on this page.
                    dataObj['Site Name'] = "CommBuys";
                    dataObj['Title'] = await newPage.$eval('tr.tableStripe-01 > td:nth-child(4)', text => text.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, "") || 'Title is unavailable.');
                    dataObj['Open Date'] = await newPage.$eval('td > table > tbody > tr:nth-child(6) > td:nth-child(6)', text => text.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, "").trim());
                    dataObj['Close Date'] = await newPage.$eval('tr.tableStripe-01 > td:nth-child(6)', text => text.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, "").trim() || 'Close Date is unavailable.');
                    dataObj['State'] = "MA";
                    dataObj['Agency'] = await newPage.$eval('tr:nth-child(3) > td:nth-child(4)', text => text.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, "") || 'Agency is unavailable.');
                    // There are two possible locations the description can appear, use a ternary operator to decide which location to use.
                    let descSum = (await newPage.$('tr > td > table > tbody > tr:nth-child(9) > td > table > tbody > tr:nth-child(2) > td.tableText-01')) ? await newPage.$eval('tr > td > table > tbody > tr:nth-child(9) > td > table > tbody > tr:nth-child(2) > td.tableText-01', text => text.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, "")) : await newPage.$eval('tr > td > table > tbody > tr:nth-child(10) > td > table > tbody > tr:nth-child(2) > td.tableText-01', text => text.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, ""));
                    dataObj['Description'] = descSum
                    await newPage.close();
                    return dataObj;
                } else { // If we encounter a back-end error, abort scraping this page.
                    console.log("System error caught");
                    await newPage.close();
                    return null;
                }
            };

            // Iterate over all bid URLs that we scraped earlier.
            for (link in urls) {
                try {
                    // Create a new page instance for the individual bid URL to scrape relevant data.
                    let currentPageData = await pagePromise(urls[link]);
                    // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
                    let newOpen = new Date(currentPageData["Open Date"]);
                    let newClose = new Date(isValidDate(currentPageData["Close Date"]))
                    // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
                    scrapedData.push({
                        "site_name": currentPageData["Site Name"],
                        "url": urls[link],
                        "title": currentPageData["Title"],
                        "login_required": false,
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
                    fs.writeFile("./0.Scraper2/CommBuysAllData.json", JSON.stringify(scrapedData), 'utf8', function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("The data has been scraped and saved successfully! View it at '/0.Scraper2/CommBuysAllData.json'");
                    });
                } catch (e) {
                    console.log(e);
                }
            }

            // Pagination code for moving on to the next page if the next page exists.
            try {
                // Check if the next button is in a disabled state.
                let disabledButton = await page.$('span.ui-paginator-next.ui-state-default.ui-corner-all.ui-state-disabled')
                console.log(disabledButton === null);
                if (disabledButton === null) { // If it is not disabled, click it then recursively scrape the next page.
                    await page.click('span.ui-paginator-next.ui-state-default.ui-corner-all');
                    await delay(1500);
                    await scrapeCurrentPage();
                } else { // If it is disabled, we are done scraping this website! Return the scrapedData array.
                    await page.close();
                    return scrapedData;
                }
            } catch (err) {
                console.error(err);
            }
            // This return is utilized in the recursive calls.
            return scrapedData;
        }
        let data = await scrapeCurrentPage();
        console.log(data);
        return data;
    }
}

module.exports = scraperObject;
