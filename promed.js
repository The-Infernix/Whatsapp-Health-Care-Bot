import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
dotenv.config();

const USERNAME = process.env.PROMED_USERNAME;
const PASSWORD = process.env.PROMED_PASSWORD;
const SEARCH_QUERY = 'dengue';
// CHANGED: Use a historical date range to avoid 404/No Results pages
const DATE_FROM = '2024-01-01'; 
const DATE_TO = '2024-12-31'; 

// Helper function for non-blocking delay (Replaces page.waitForTimeout)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchProMEDOutbreaks() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized'],
    defaultViewport: null,
  });
  const page = await browser.newPage();

  try {
    // ------------------ LOGIN ------------------
    await page.goto('https://www.promedmail.org/auth/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#username', { timeout: 3000 });
    await page.type('#username', USERNAME);
    await page.waitForSelector('#password', { timeout: 3000 });
    await page.type('#password', PASSWORD);
    await page.waitForSelector('button[type="submit"]', { timeout: 3000 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Logged in successfully');

    // ------------------ SEARCH ------------------
    const searchURL = `https://www.promedmail.org/search/?q=${SEARCH_QUERY}&date=${DATE_FROM}..${DATE_TO}`;
    await page.goto(searchURL, { waitUntil: 'networkidle0' });

    // ------------------ OPEN LOCATION FILTER ------------------
    
    // 1. Ensure the element is ready to be scrolled to/viewed.
    await page.waitForSelector('#radix-«rh»', { visible: true, timeout: 10000 });

    // 2. Scroll the element into view smoothly.
    await page.evaluate(() => {
      const targetElement = document.getElementById('radix-«rh»');
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    });
    console.log('✅ Initiated smooth scroll to Location filter');

    // Add a pause to allow the smooth scroll animation to finish
    await sleep(500); // 0.5 second pause using sleep helper

    // 3. Open Location filter
    await page.click('#radix-«rh»');
    console.log('✅ Location filter opened');

    // ------------------ CLICK FIRST FILTER OPTION ------------------
    const complexSelector = '.pb-4 > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > label:nth-child(2) > span:nth-child(2)';
    
    // Wait for the option to appear inside the now-open filter
    await page.waitForSelector(complexSelector, { visible: true, timeout: 15000 }); 
    
    // Click the first filter option
    await page.click(complexSelector);
    console.log('✅ Clicked the first filter option');
    
    // Wait for the filter results to update
    await sleep(3000); // 3 second pause using sleep helper

    // ------------------ CLICK SECOND FILTER OPTION ------------------
    const NcomplexSelector = '#radix-«ri» > div > div > div:nth-child(2) > div > div:nth-child(1) > label > span.text-muted-foreground';
    
    // The second filter is likely in a different filter panel or a new modal, so wait for it.
    await page.waitForSelector(NcomplexSelector, { visible: true, timeout: 15000 }); 
    
    // Click the second element
    await page.click(NcomplexSelector);
    console.log('✅ Clicked the second filter option');
    
    
    // ------------------ SCRAPE TABLE ------------------
    // Wait for the table to refresh after applying both filters
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const outbreaks = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          alertId: cells[0]?.innerText.trim() || '',
          date: cells[1]?.innerText.trim() || '',
          title: cells[2]?.innerText.trim() || '',
          region: cells[3]?.innerText.trim() || '',
          disease: cells[4]?.innerText.trim() || '',
          species: cells[5]?.innerText.trim() || '',
          location: cells[6]?.innerText.trim() || '',
          network: cells[7]?.innerText.trim() || '',
        };
      });
    });

    // Keep browser open
    return outbreaks;
  } catch (err) {
    console.error('❌ Error fetching ProMED outbreaks:', err);
    return [];
  }
}

// --------------------------- RUN ---------------------------
(async () => {
  const outbreaks = await fetchProMEDOutbreaks();
  if (outbreaks.length === 0) {
    console.log('✅ No new outbreaks found.');
  } else {
    console.log('⚠️ New Outbreaks:');
    outbreaks.forEach(outbreak => {
      console.log(`- Alert ID: ${outbreak.alertId}`);
      console.log(`  Date: ${outbreak.date}`);
      console.log(`  Title: ${outbreak.title}`);
      console.log(`  Region: ${outbreak.region}`);
      console.log(`  Disease: ${outbreak.disease}`);
      console.log(`  Species: ${outbreak.species}`);
      console.log(`  Location: ${outbreak.location}`);
      console.log(`  Network: ${outbreak.network}`);
      console.log('');
    });
  }

  // Wait for user input before closing
  console.log('⏸ Press ENTER to close browser...');
  process.stdin.once('data', async () => {
    process.exit(0);
  });
})();