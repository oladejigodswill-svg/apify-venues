import { Actor, Dataset, log } from 'apify';
import { PuppeteerCrawler } from 'crawlee';

await Actor.init();

// Get input from user
const input = await Actor.getInput();
const { venues = [] } = input;

const results = [];

// Build Instagram location URL
function getLocationUrl(venue) {
    const slug = venue.trim().replace(/\s+/g, '_').toLowerCase();
    return `https://www.instagram.com/explore/locations/${slug}/`;
}

// PuppeteerCrawler
const crawler = new PuppeteerCrawler({
    maxConcurrency: 2,
    launchContext: {
        useChrome: true,
        launchOptions: {
            headless: true, // set false if you want to debug
        },
    },
    // Apify Proxy to reduce blocking
    proxyConfiguration: await Actor.createProxyConfiguration(),
    async requestHandler({ page, request }) {
        const venue = request.userData.venue;

        log.info(`Scraping venue: ${venue} -> ${request.url}`);

        // Wait for Instagram content to load
        await page.waitForTimeout(5000);

        // Grab all profile links
        const profileLinks = await page.$$eval('a', (links) =>
            links
                .map((a) => a.getAttribute('href'))
                .filter((href) => href && href.startsWith('/') && !href.includes('/p/') && !href.includes('/stories/'))
        );

        for (const href of profileLinks) {
            const username = href.split('/')[1];
            if (username) {
                results.push({
                    venue,
                    username,
                    profileUrl: `https://www.instagram.com/${username}/`,
                    date: new Date().toISOString().split('T')[0],
                });
            }
        }
    },
    failedRequestHandler({ request }) {
        log.error(`❌ Failed to process ${request.url}`);
    },
});

// Add venues to crawler
for (const venue of venues) {
    await crawler.addRequests([{ url: getLocationUrl(venue), userData: { venue } }]);
}

// Run the crawler
await crawler.run();

// Save output
await Dataset.pushData(results);

log.info(`✅ Scraping complete. Found ${results.length} profiles.`);

await Actor.exit();
