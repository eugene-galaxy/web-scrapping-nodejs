const fs = require('fs');

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

const scraperObject = {
    site_name: 'Virginia',
    async scraper(browser) {

        let page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080
        });

        let scrapedData = [];

        // This is an example of a scraper that directly utilizes the back-end API of a website. This allows us to avoid the finicky front-end navigation and directly retrieve
        // the raw data which contains what we want to extract.
        async function scrapeCurrentPage() {

            // Base Site URL: https://mvendor.cgieva.com/Vendor/public/AllOpportunities.jsp
            //
            // In order to identify the API, we need to use Chrome Dev Tools. Follow the base site URL for Virginia above and open Dev Tools with 'Ctrl + Shift + I', 
            // then click on the network tab on the top of Chrome Dev Tools, click on 'Fetch/XHR' and then refresh the page. You should see the network activity 
            // of the site being listed in the table below. Look for a GET request that contains the bid data. If you see one and it isn't protected by an API key, we
            // should be able to use it!

            // Here is a call to the API which I identified using the strategy above. I have modified the parameters a bit to retrieve the most relevant data.
            let url = `https://mvendor.cgieva.com/Vendor/public/solrconnect.jsp?q=*:*&fq=status%3A(%22Open%22)&sort=pubdate%20desc,id%20desc&facet.field=status&rows=1000`;

            console.log(`Navigating to ${url}...`);
            await page.goto(url);

            // Use puppeteer to read the API response as if it is a normal webpage.
            let getData = await page.$eval('body', text=> text.innerText);
        
            // Parse the raw page data into a digestable JSON format, and extract some useful variables from the parsed data.
            let parsedData = JSON.parse(getData)
            let totalRecords = parsedData.response.numFound;
            // dataUpdated is the array containg all bid entries from the response.
            let dataUpdated = parsedData.response.docs

            console.log("Records found: " + totalRecords);
            console.log(dataUpdated.length);

            // Extract all relevant fields and store them in independant arrays
            let titles = [...dataUpdated.flatMap((get)=> [get.shortdesc])];
            let versions = [...dataUpdated.flatMap((get)=> [get.version])];
            let ids = [...dataUpdated.flatMap((get)=> [get.internalid])];
            let closeDates = [...dataUpdated.flatMap((get)=> [get.closedate])];
            let openDates = [...dataUpdated.flatMap((get)=> [get.pubdate])];
            let descriptions = [...dataUpdated.flatMap((get)=> [get.longdesc])];
            let agencies = [...dataUpdated.flatMap((get)=> [get.agencyname])];

            console.log(titles.length);
            console.log(versions.length);
            console.log(ids.length);
            console.log(closeDates.length);
            console.log(openDates.length);
            console.log(descriptions.length);
            console.log(agencies.length);

            // Iterate over all arrays to form the data into our final output structure
            for (let index in titles) {  
                    // Set to Open or Close Date
                    let newOpen = new Date(openDates[index]);
                    let newClose = new Date(closeDates[index])
                    let descriptionFormatted = descriptions[index] !== undefined ? descriptions[index].replace(/[^A-Za-z0-9 ]/g, "").trim() : "Click the 'Link to bid' button below for more information"
                    let bidURL = `https://mvendor.cgieva.com/Vendor/public/IVDetails.jsp?PageTitle=SO%20Details&rfp_id_lot=${ids[index]}&rfp_id_round=${versions[index]}`
                    scrapedData.push({
                        "site_name": "Virginia",
                        "url": bidURL, 
                        "title": titles[index],
                        "login_required": false,
                        "payment_required": false,
                        "open_date": newOpen.toLocaleDateString(),
                        "open_timestamp": Math.floor(newOpen.getTime() / 1000),
                        "close_date": newClose.toLocaleDateString(),
                        "close_timestamp": Math.floor(newClose.getTime() / 1000),
                        "state": "VA",
                        "agency" : agencies[index],
                        "description": descriptionFormatted
                    });
                    fs.writeFile("./0.Scraper2/VirginiaAllData.json", JSON.stringify(scrapedData), 'utf8', function(err) {
                        if(err) {
                            return console.log(err);
                        }
                        console.log("The data has been scraped and saved successfully! View it at './VirginiaAllData.json'");
                    });    
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