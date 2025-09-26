import { Actor } from 'apify';
import axios from 'axios';

// Helper to simulate getting Location ID from Venue name.
// In production, you’d refine this with an Instagram endpoint or a search API.
async function getLocationIdFromVenue(venueName) {
    // Example: Replace spaces with underscores
    return venueName.replace(/\s+/g, '_').toLowerCase();
}

// Helper to fetch "stories" for a location ID.
// ⚠️ Real scraping may need Puppeteer or Apify Proxy if Instagram blocks requests.
async function fetchLocationStories(locationId) {
    // Mock Instagram request (replace with actual endpoint if available)
    const fakeResponse = {
        stories: [
            { username: "user1", url: `https://www.instagram.com/user1/` },
            { username: "user2", url: `https://www.instagram.com/user2/` }
        ]
    };

    return fakeResponse.stories;
}

await Actor.init();

// Get input from schema
const input = await Actor.getInput();
const { venues = [] } = input;

const results = [];

for (const venue of venues) {
    const locationId = await getLocationIdFromVenue(venue);
    const stories = await fetchLocationStories(locationId);

    for (const story of stories) {
        results.push({
            venue,
            username: story.username,
            profileUrl: story.url,
            date: new Date().toISOString().split('T')[0]
        });
    }
}

// Save to Apify Dataset
await Actor.pushData(results);

await Actor.exit();
