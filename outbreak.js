// outbreak-alert-india.js
import fetch from "node-fetch";
import fs from "fs";

// File to store already alerted outbreak IDs
const SEEN_FILE = "seen_outbreaks.json";
let seenOutbreaks = fs.existsSync(SEEN_FILE)
  ? JSON.parse(fs.readFileSync(SEEN_FILE))
  : [];

// Function to fetch and check outbreaks
async function checkOutbreaks() {
  try {
    const res = await fetch("https://www.who.int/api/news/outbreaks");
    const data = await res.json();
    console.log("DEBUG: WHO outbreaks response:", JSON.stringify(data, null, 2));

    if (!data.value || !Array.isArray(data.value)) {
      console.error("❌ Unexpected WHO response format");
      return;
    }
    if (!data.value || data.value.length === 0) {
  console.log("⚠️ No outbreaks found from WHO. Injecting test outbreak...");

  data.value = [
    {
      Title: "Test Outbreak: Mystery Flu in Hyderabad",
      Url: "https://example.com/test-outbreak"
    }
  ];
}


    if (data.value.length === 0) {
      console.log("✅ No active outbreaks listed right now.");
      return;
    }

    for (let outbreak of data.value) {
      console.log(`⚠️ ${outbreak.Title} — ${outbreak.Url}`);
    }

  } catch (err) {
    console.error("❌ Error fetching outbreaks:", err.message);
  }
}

checkOutbreaks();

setInterval(checkOutbreaks, 1000 * 60);
