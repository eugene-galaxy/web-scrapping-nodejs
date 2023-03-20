# scraper-development

This repository is for the rapid development of web scrapers for the Bid Banana engine.

# Quick Start Guide

Clone this repo into your local dev environment with ```git clone https://github.com/TheBidLab/scraper-development.git```

Then, install dependencies from package.json files using ```npm install```

# Repository Guide

## Repository File Structure and Development Process

### Development Process

Our development process will usually consist of the individual contributor creating their own branch to work on, then once they have a sufficient amount of scrapers in staging they will open PR to merge into ```main``` branch where Jacob will review the scrapers and etiher merge the PR or relay feedback for improvements.

The naming convention for the scrapers is as follows: the scraper should be named [site_name]PageScraper.js and the JSON output file should be called [site_name]AllData.json. For example, if we have this site: https://www.ci.xenia.oh.us/bids.aspx, and it has been designated the site_name "Xenia", our page scraper would be called XeniaPageScraper.js and it's output file would write to XeniaAllData.json.

### Repository File Structure

The examples, finalized, staging, and development folders all contain the file structure required to run our web scrapers. Inside each folder there should be 2 folders: 0.Scraper2 and 0.Scrapers, and 1 file: runScrape.js (potentially 2 files, if your scraper(s) threw errors during execution you will also have a log.json). "0.Scraper2" is the bin folder that all of the data generated from each web scraper is written to. "0.Scrapers" contains each individual scraper. "runScrape.js" is the script that runs all scrapers contained in "0.Scrapers".

Below is the intended use of each of the folders.

### finalized

The finalized folder is where all of the scrapers which have been completed and approved by Jacob will end up. From there they will be integrated into our web scraping engine.

### staging

The staging folder is where all of the scrapers that are completed but still pending review by Jacob will reside.

### development

The development folder is where you will actually develop and test your individual scrapers. Once you are happy with the state of your scraper you will move it to staging.

### examples

This folder contains example scrapers for you to reference while developing your own scrapers. They span a variety of website structures and should have most of the strategies for scraping different types of websites covered.

### Notes on .gitkeep:

GitHub does not track empty folders, so in order to keep the important file structure intact on GitHub, it is necessary to include a .gitkeep file. Remove this file when there is actual content inside the directory or else the scraper will not run properly.

# Data Schema for JSON Output:

```
site_name : String
url : String
title : String
login_required : Boolean
payment_required : Boolean
open_date : String
open_timestamp : Integer
close_date : String
close_timestamp : Integer
state : String
agency : String
description : String
```

### site_name

Our alias for the site, it is meant to be concise and descriptive of the agency that the website represents. This will be provided to you for each website you are assigned.

### url

A direct url to the invidiual bid that this JSON object describes. We try to be as granular as a possible with the url, but if the website
we are scraping does not have unique links for each individual bid, we just use the url that directs to the section of the website that displays all of the bids.

### title

The name/title of the individual bid.

### login_required

A boolean value describing whether or not this bid requires login credentials to access the information from the "url" provided.

### payment_required

A boolean value describing whether or not any form payment is required to access the information from the "url" provided.

### open_date

A string in the format of MM/DD/YYYY that represents the day that this bid opportunity was posted. If no posted/opening day is provided, set this day as the day of the scrape (```new Date()```).

### open_timestamp

A UNIX time stamp representation of the "open_date". You can easily create this timestamp from a JavaScript Date() object using the following code:

```
// Generates a UNIX timestamp at this exact moment
let date = new Date();
let date_timestamp = Math.floor(date.getTime() / 1000);
```

### close_date

A string in the format of MM/DD/YYYY that represents the day that this bid opportunity is set to be closed. If no close date is provided, set this day as "01/01/2099".

### close_timestamp

A UNIX time stamp representation of the "close_date". You can easily create this timestamp from a JavaScript Date() object using the following code:

```
// Generates a UNIX timestamp at this exact moment
let date = new Date();
let date_timestamp = Math.floor(date.getTime() / 1000);
```

### state

The US state that this bid is posted in

### agency

The agency/municipality that is posting this bid.

### description

The description of this bid posting. If there is no apparent description, use this placeholder string: 'Click the ‘Link to bid’ button below for more information'.

## Data Quality Checklist

1. Ensure the following fields are pulling through ***correctly*** for each bid:  
    - site_name
    - url
    - title
    - login_required
    - payment_required
    - open_date
        - If an open date does not exist on the agency site, use date of scrape (new Date()).
    - open_timestamp
    - close_date
        - If a close date does not exist on the agency site, use 01/01/2099.
    - close_timestamp
    - state
    - agency
    - description
        - If no description exists, ensure 'Click the “Link to bid” button below for more information.' is included in the field.

2. Are all open bids that currently exist on the agency site being included in scrape?
    - Compare the agency site bid count with the scraped data to ensure all open bids are there.  

3. If everything looks good for the above items, then it should be passed over to Jacob for final review and approval!

## Example of a JSON Ouput File

Reference site: https://www.ci.xenia.oh.us/bids.aspx  

This file would be named XeniaAllData.json and exist in the 0.Scraper2 directory after running XeniaPageScraper.js

```
[
    {
        "site_name": "Xenia",
        "url": "https://www.ci.xenia.oh.us/bids.aspx?bidID=98",
        "title": "2023 Bellbrook Avenue Resurfacing Project from Allison Ave to Second St",
        "login_required": false,
        "payment_required": false,
        "open_date": "1/17/2023",
        "open_timestamp": 1673942400,
        "close_date": "2/7/2023",
        "close_timestamp": 1675728000,
        "state": "OH",
        "agency": "City of Xenia",
        "description": "The City is soliciting bids for the project known as the 2023 Bellbrook Ave Resurfacing Project from Allison Ave to Second St. PID#117013.Sealed bids to provide all necessary labor, equipment and materials needed to mill and resurface Bellbrook Ave., Xenia, Ohio from Allison Ave. to Second St. as directed by the City Engineer and in accordance with the General Conditions, Specifications, Required Contract Provisions, and Plans and/or Drawings included in the bid packet will be received in the Office of the City Clerk, 107 E Main St., Xenia, Ohio 45385 until Tuesday, February 7, 2023 at 2:30 p.m. To view the legal ad, please click here."
    },
    {
        "site_name": "Xenia",
        "url": "https://www.ci.xenia.oh.us/bids.aspx?bidID=100",
        "title": "2023 E Market St ADA Ramp Project",
        "login_required": false,
        "payment_required": false,
        "open_date": "1/17/2023",
        "open_timestamp": 1673942400,
        "close_date": "2/7/2023",
        "close_timestamp": 1675728000,
        "state": "OH",
        "agency": "City of Xenia",
        "description": "The City is Soliciting bids for the project known as the 2023 E. Market St. ADA Ramp Project. Sealed bids to provide all necessary labor, equipment and materials to remove and replace existing ADA Ramps to meet ADA Compliance on E. Market St., Xenia, Ohio as directed by the City Engineer and in accordance with the General Conditions, Specifications, Plans and/or Drawings included in the bid packet will be received in the Office of the City Clerk, 107 E. Main St., Xenia, Ohio 45385 until Tuesday, February 7, 2023 at 2:00 p.m.To view the legal ad, please click here. "
    },
    {
        "site_name": "Xenia",
        "url": "https://www.ci.xenia.oh.us/bids.aspx?bidID=99",
        "title": "2023 N Detroit Street Resurfacing Project from Kinsey Rd to Church St",
        "login_required": false,
        "payment_required": false,
        "open_date": "1/17/2023",
        "open_timestamp": 1673942400,
        "close_date": "2/7/2023",
        "close_timestamp": 1675728000,
        "state": "OH",
        "agency": "City of Xenia",
        "description": "The City is soliciting bids for the project known as the 2023 N. Detroit St. Resurfacing Project from Kinsey Rd. to Church St. PID#110506.Sealed bids to provide all necessary labor, equipment and materials needed to mill and resurface N. Detroit St., Xenia, Ohio from Kinsey Rd. to Church St. as directed by the City Engineer and in accordance with the General conditions, Specifications, Required Contract Provisions, and Plans and/or Drawings included in the bid packet will be received in the Office of the City Clerk, 107 E. Main St., Xenia, Ohio 45385 until Tuesday, February 7, 2023 at 2:15 p.m.To view this legal ad, please click here. "
    }
]
```
