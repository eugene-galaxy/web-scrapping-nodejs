const fs = require('fs');

// This function sets a delay in milliseconds
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

const scraperObject = {
    // The URL of the site being scraped
    url: ('https://www.generalservices.state.nm.us/state-purchasing/active-itbs-and-rfps/active-procurements/'),
    site_name: 'NewMexico',
    async scraper(browser) {
        // Initialize page object and navigate to the url.
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url);
        let scrapedData = [];

        // This website uses an iFrame, we must set our scope accordingly to see the data nested in the frame.
        let frames = await page.frames();
        let contentFrame = frames[1];

        // Starts the scrape and waits for the DOM to render. Use Puppeteer to scrape data.
        async function scrapeCurrentPage() {

            // Wait for content to render.
            await contentFrame.waitForSelector('#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody');

            // Get the total number of rows in the table.
            let rowCount = await contentFrame.$eval('#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody', element => element.childElementCount)

            // Initialize arrays to store the scraped data fields for each row.
            let titles = [];
            let agencies = [];
            let openDates = [];
            let closeDates = [];
            let descriptions = [];

            // Iterate over each row of the table.
            for (let i = 1; i <= rowCount; i++) {

                // Wait for the row to be accessible.
                await contentFrame.waitForSelector(`#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody > tr:nth-child(${i}) > td:nth-child(6)`);
                console.log(`Scraping bid ${i}...`);

                // Scrape the relevant data fields from the row.
                let title = await contentFrame.$eval(`#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody > tr:nth-child(${i}) > td:nth-child(6)`, element => element.textContent);
                let agency = await contentFrame.$eval(`#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody > tr:nth-child(${i}) > td:nth-child(5)`, element => element.textContent.substring(8).trim());
                let closeDate = await contentFrame.$eval(`#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody > tr:nth-child(${i}) > td:nth-child(3)`, element => element.textContent);
                let procurementID = await contentFrame.$eval(`#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody > tr:nth-child(${i}) > td:nth-child(4) > a`, element => element.textContent);

                // Wait for the link to indiviudal bid to be accessible, the click on the link to navigate to the bid page.
                await contentFrame.waitForSelector(`#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody > tr:nth-child(${i}) > td:nth-child(4)`);
                await contentFrame.focus(`#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody > tr:nth-child(${i}) > td:nth-child(4) > a`);
                await contentFrame.click(`#ctl00_ContentPlaceHolder1_rgProcurements_ctl00 > tbody > tr:nth-child(${i}) > td:nth-child(4) > a`);

                // Wait for the individual bid data to be accessible.
                await contentFrame.waitForSelector('#ContentPlaceHolder1_txtProcurementNumber2');

                // Scrape relevant data from the individual bid page.
                let openDateSelector = await contentFrame.$('#ContentPlaceHolder1_lblDateContractTermBegin');
                let openDate;
                if (openDateSelector !== null) {
                    openDate = await contentFrame.$eval(`#ContentPlaceHolder1_lblDateContractTermBegin`, element => element.textContent);
                } else {
                    openDate = new Date().toLocaleDateString();
                }
                let descriptionSelector = await contentFrame.$('#ContentPlaceHolder1_lblProcurementDescription');
                let description;
                if (descriptionSelector !== null) {
                    description = await contentFrame.$eval(`#ContentPlaceHolder1_lblProcurementDescription`, element => element.textContent);
                } else {
                    description = "Click the 'Link to bid' button below for more information and reference procurement ID: " + procurementID;
                }

                // Push all of the scraped data into their designated arrays.
                descriptions.push(description);
                openDates.push(openDate);
                titles.push(title);
                agencies.push(agency);
                closeDates.push(closeDate);

                // Use the navigation on the page to navigate back to the bid directory table.
                await contentFrame.focus(`#ContentPlaceHolder1_lbBack`);
                await contentFrame.click('#ContentPlaceHolder1_lbBack');
            }

            // Iterate over the title array. (Any of the data arrays should work, they should all be the same length)
            for (let title in titles) {
                // Create new Date() objects from the close and open dates to use for open_date, close_date, open_timestamp, and close_timestamp.
                let newOpen = new Date(openDates[title]);
                let newClose = new Date(closeDates[title]);
                // Finally, if the close date does not exceed todays date (meaning the bid is still open), add all scraped data to a final JSON object and push to the scrapedData array.
                if (newClose >= (new Date())) {
                    scrapedData.push({
                        "site_name": "NewMexico",
                        "url": "https://www.generalservices.state.nm.us/state-purchasing/active-itbs-and-rfps/active-procurements/",
                        "title": titles[title],
                        "login_required": false,
                        "payment_required": false,
                        "open_date": newOpen.toLocaleDateString(),
                        "open_timestamp": Math.floor(newOpen.getTime() / 1000),
                        "close_date": newClose.toLocaleDateString(),
                        "close_timestamp": Math.floor(newClose.getTime() / 1000),
                        "state": "NM",
                        "agency": agencies[title],
                        "description": descriptions[title],
                    });
                    // Write the current scrapedData array to the appropriate "AllData" file.
                    fs.writeFile("./0.Scraper2/NewMexicoAllData.json", JSON.stringify(scrapedData), 'utf8', function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("The data has been scraped and saved successfully! View it at '/0.Scraper2/NewMexicoAllData.json'");
                    });
                }
                // Add a small delay between writing each bid to limit race conditions. This is necessary if we are not visiting each individual
                // bid on a separate page.
                await delay(10);
            }
            await page.close();
            return scrapedData;
        }
        let data = await scrapeCurrentPage();
        console.log(data);
        return data;
    }
}

module.exports = scraperObject;