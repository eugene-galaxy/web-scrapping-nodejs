const fs = require('fs');

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
    url: ('https://www.ci.xenia.oh.us/bids.aspx'),
    site_name: 'Xenia',
    async scraper(browser) {
        // Initialize page object and navigate to the url
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url);
        let scrapedData = [];

        // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
        async function scrapeCurrentPage() {

            // Wait for content to render.
            await page.waitForSelector('#modulecontent > table > tbody > tr > td:nth-child(2) > div.pageStyles > table > tbody');

            // Select all urls that link directly to individual bids.
            let urls = await page.$$eval('td:nth-child(2) > span:nth-child(1) > a', links => {
                links = links.map(element => element.href)
                return links;
            });

            console.log(urls);

            // Select all bid titles that are available on this page.
            let titles = await page.$$eval('td:nth-child(2) > span:nth-child(1) > a', titles => {
                titles = titles.map(element => element.textContent)
                return titles;
            });

            // Select all close dates that are available on this page.
            let closeDates = await page.$$eval('td:nth-child(4) > span:nth-child(3)', cds => {
                cds = cds.map(element => element.textContent)
                return cds;
            });
            

            // Access the URL on a new page instance and select relevant data.
            let pagePromise = async (link) => {

                // Initalize the new page instance and the data object to store information.
                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link);

                // Scrape revelant data fields.
                dataObj['Site Name'] = "Xenia";
                dataObj['Open Date'] = await newPage.$eval('#modulecontent > table > tbody > tr > td:nth-child(2) > div:nth-child(3) > div.fr-view.responsiveEditor > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td > span', text => text.textContent.replace(/(\s\d{2}:\d{2}:\d{2}\s*(PM|AM))/, ""));
                dataObj['State'] = "OH";
                dataObj['Agency'] = "City of Xenia";
                let description = await newPage.$eval('#modulecontent > table > tbody > tr > td:nth-child(2) > div:nth-child(3) > div.fr-view.responsiveEditor > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > span', text => text.textContent.replace(/\s*(\r\n\t|\n|\r|\t)\s*/gm, ""));
                dataObj["Description"] = description.replace(/(<([^>]+)>)|(For security reasons, you must enable JavaScript to view this E-mail address)|(document.write(.*)\))/ig, '');

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
                    let newClose = new Date(isValidDate(closeDates[link]));
                    // Finally, add all scraped data to a final JSON object and push to the scrapedData array.
                    scrapedData.push({
                        "site_name": currentPageData["Site Name"],
                        "url": urls[link],
                        "title": titles[link],
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
                    fs.writeFile("./0.Scraper2/XeniaAllData.json", JSON.stringify(scrapedData), 'utf8', function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("The data has been scraped and saved successfully! View it at '/0.Scraper2/XeniaAllData.json'");
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