import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = pkg;

import qrcode from "qrcode-terminal";
import axios from "axios";
import cloudinary from "cloudinary";
import pdf from "pdf-parse";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { exec, spawn } from "child_process";   
import dotenv from 'dotenv';
// NEW IMPORT: Puppeteer is required for the ProMED scraper
import puppeteer from 'puppeteer'; 

// --------------------------- CONFIG ---------------------------
const OPENROUTER_API_KEY = ""; // replace with your key

const tempFolder = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });

cloudinary.config({
  cloud_name: "",
  api_key: "",
  api_secret: "",
});



// --------------------------- MEMORY ---------------------------
const chatHistory = {}; // { userId: [ { role, content } ] }

// --------------------------- HELPER FUNCTIONS ---------------------------
// Helper function for non-blocking delay (Replaces page.waitForTimeout)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --------------------------- IMAGE UPLOAD ---------------------------
async function uploadToCloudinary(base64Image) {
  try {
    const res = await cloudinary.v2.uploader.upload(
      `data:image/jpeg;base64,${base64Image}`,
      { folder: "whatsapp-bot" }
    );
    return res.secure_url;
  } catch (err) {
    console.error("❌ Cloudinary upload failed:", err.message);
    return null;
  }
}

// --------------------------- PDF TEXT EXTRACTION ---------------------------
async function extractTextFromPDF(base64Data) {
  try {
    if (!base64Data) throw new Error("No PDF data provided");
    const buffer = Buffer.from(base64Data, "base64");
    const data = await pdf(buffer);
    return data.text || "";
  } catch (err) {
    console.error("❌ PDF parse error:", err.message);
    return null;
  }
}

// --------------------------- WHISPER.CPP TRANSCRIPTION ---------------------------
const WHISPER_PATH = path.join(process.cwd(), "whisper-bin-x64", "Release");
const MODEL_PATH = path.join(WHISPER_PATH, "models", "");

async function transcribeVoice(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const wavPath = filePath.replace(ext, ".wav");

  await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .outputOptions(["-ac 1", "-ar 16000", "-f wav"])
      .on("end", resolve)
      .on("error", (err, stdout, stderr) => {
        console.error("❌ FFmpeg error:", stderr || err.message);
        reject(err);
      })
      .save(wavPath);
  });

  return new Promise((resolve, reject) => {
    const cmd = `"${path.join(WHISPER_PATH, "whisper-cli.exe")}" -m "${MODEL_PATH}" -l en "${wavPath}" --output-txt`;

    exec(cmd, { cwd: WHISPER_PATH }, (error, stdout, stderr) => {
      if (error) {
        reject(`❌ Whisper.cpp error: ${stderr || error.message}`);
        return;
      }

      const outFile = wavPath + ".txt";
      if (!fs.existsSync(outFile)) {
        reject("❌ No transcription file generated");
        return;
      }

      const text = fs.readFileSync(outFile, "utf8").trim();
      resolve(text);
    });
  });
}

// --------------------------- GROK-4 WITH HISTORY ---------------------------
async function getGrokResponseWithHistory(history, imageUrl = null) {
  const systemInstruction = `

  `;

  try {
    const messages = [{ role: "system", content: systemInstruction }, ...history];

    if (imageUrl) {
      messages.push({
        role: "user",
        content: [{ type: "image_url", image_url: { url: imageUrl } }],
      });
    }

    const response = await axios.post(
      "",
      {
        model: "",
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Grok API Error:", error.response?.data || error.message);
    return "⚠️ Sorry, I could not process your request right now.";
  }
}

// --------------------------- TTS (TEXT TO VOICE using Python ParlerTTS) ---------------------------

const pythonPath = "";

async function generateTTSwithPython(text, outputFile) {
  return new Promise((resolve, reject) => {
    const python = spawn(pythonPath, ["tts_trail/tts.py", text, outputFile]);

    python.stdout.on("data", (data) => console.log(`PYTHON: ${data}`));
    python.stderr.on("data", (data) => console.error(`PYTHON ERR: ${data}`));

    python.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputFile)) {
        resolve(outputFile);
      } else {
        reject(new Error("TTS generation failed"));
      }
    });
  });
}


async function sendVoiceResponse(client, chatId, text) {
  try {
    const filePath = path.join(tempFolder, `${Date.now()}_tts.wav`);
    await generateTTSwithPython(text, filePath);

    const audioFile = MessageMedia.fromFilePath(filePath);
    await client.sendMessage(chatId, audioFile, { sendAudioAsVoice: true });

    console.log("🔊 Sent AI voice reply (ParlerTTS).");
  } catch (err) {
    console.error("❌ TTS error:", err.message);
  }
}

// --------------------------- PROMED SCRAPER ---------------------------
// NOTE: Ensure PROMED_USERNAME and PROMED_PASSWORD are set in your environment variables (.env file)
const PROMED_USERNAME = process.env.PROMED_USERNAME; 
const PROMED_PASSWORD = process.env.PROMED_PASSWORD;
const SEARCH_QUERY = 'dengue';
const DATE_FROM = '2024-01-01'; // Historical date to ensure results
const DATE_TO = '2024-12-31'; 

async function fetchProMEDOutbreaks() {


    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Use headless true for server environment
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
            defaultViewport: null,
        });
        const page = await browser.newPage();

        // ------------------ LOGIN ------------------
        await page.goto('https://www.promedmail.org/auth/login', { waitUntil: 'networkidle0' });
        await page.waitForSelector('#username', { timeout: 30000 });
        await page.type('#username', "");
        await page.waitForSelector('#password', { timeout: 30000 });
        await page.type('#password', "");
        await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // ------------------ SEARCH ------------------
        const searchURL = `https://www.promedmail.org/search/?q=${SEARCH_QUERY}&date=${DATE_FROM}..${DATE_TO}`;
        await page.goto(searchURL, { waitUntil: 'networkidle0' });

        // ------------------ OPEN LOCATION FILTER ------------------
        await page.waitForSelector('#radix-«rh»', { visible: true, timeout: 10000 });

        await page.evaluate(() => {
          const targetElement = document.getElementById('radix-«rh»');
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        await sleep(500); 

        await page.click('#radix-«rh»');

        // ------------------ CLICK FIRST FILTER OPTION ------------------
        const complexSelector = '.pb-4 > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > label:nth-child(2) > span:nth-child(2)';
        await page.waitForSelector(complexSelector, { visible: true, timeout: 15000 }); 
        await page.click(complexSelector);
        
        await sleep(3000); 

        // ------------------ CLICK SECOND FILTER OPTION ------------------
        const NcomplexSelector = '#radix-«ri» > div > div > div:nth-child(2) > div > div:nth-child(1) > label > span.text-muted-foreground';
        await page.waitForSelector(NcomplexSelector, { visible: true, timeout: 15000 }); 
        await page.click(NcomplexSelector);
        
        // ------------------ SCRAPE TABLE ------------------
        await page.waitForSelector('table tbody tr', { timeout: 10000 });

        const outbreaks = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                return {
                    alertId: cells[0]?.innerText.trim() || 'N/A',
                    date: cells[1]?.innerText.trim() || 'N/A',
                    title: cells[2]?.innerText.trim() || 'N/A',
                    location: cells[6]?.innerText.trim() || 'N/A',
                };
            });
        });
        
        if (outbreaks.length === 0) {
            return `✅ No Dengue outbreaks reported between ${DATE_FROM} and ${DATE_TO}.`;
        }
        
        // Format the results into a single string
        let result = `⚠️ *Latest Outbreaks* \n\n`;
        outbreaks.slice(0, 10).forEach((o, index) => { // Limit to 5 results
            result += `*${index + 1}. Alert ID:* ${o.alertId}\n`;
            result += `*Date:* ${o.date}\n`;
            result += `*Title:* \n`;
            result += `*Location:* ${o.location}\n\n`;
        });
        
        // if (outbreaks.length > 5) {
        //     result += `...and ${outbreaks.length - 5} more results.`;
        // }

        return result;
    } catch (err) {
        console.error('❌ ProMED Scraper Error:', err);
        return '❌ Sorry, there was an error fetching the outbreak data.';
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}


// --------------------------- WHATSAPP CLIENT ---------------------------
const client = new Client({
  authStrategy: new LocalAuth(),
});

// --------------------------- WHATSAPP EVENTS ---------------------------
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("📲 Scan the QR code above to log in to WhatsApp.");
});

client.on("ready", () => {
  console.log("✅ WhatsApp Healthcare Bot is ready!");
  console.log("🤖 Multi-Lingual Models Loading!");
  console.log("⚙️ Image and Doc Accesser Initializing!");
  console.log("⚡ Bot Initialized");
});

// --------------------------- MESSAGE HANDLER ---------------------------
client.on("message", async (message) => {
  try {
    const userId = message.from;
    let userInput = message.body?.trim() || "";
    let imageUrl = null;
    let pdfText = null;

    // --- COMMAND HANDLER ---
    if (userInput.toLowerCase() === '/data') {
        console.log('⚡ Received /data command, starting ProMED scraper...');
        await message.reply('⏳ Please wait, fetching latest outbreak data...');
        const dataOutput = await fetchProMEDOutbreaks();
        await message.reply(dataOutput);
        // Do not continue to AI for /data command
        return; 
    }
    // --- END COMMAND HANDLER ---

    if (!chatHistory[userId]) chatHistory[userId] = [];

    if (message.hasMedia) {
      // Media handling logic (image, PDF, audio) remains the same...
      const media = await message.downloadMedia();

      if (!media || !media.mimetype) {
        console.log("⚠️ Media download failed or no mimetype.");
        return;
      }

      if (media.mimetype.startsWith("image/")) {
        console.log("📷 Received an image, uploading...");
        imageUrl = await uploadToCloudinary(media.data);
        if (!imageUrl) {
          await message.reply("⚠️ Could not upload the image. Try again.");
          return;
        }
      } else if (media.mimetype === "application/pdf") {
        console.log("📄 Received PDF, extracting text...");
        pdfText = await extractTextFromPDF(media.data);
        if (!pdfText) {
          await message.reply("⚠️ Could not read the PDF. Please try again.");
          return;
        }
      } else if (media.mimetype.startsWith("audio/")) {
        console.log("🎤 Received voice message, transcribing...");
        const fileExt = media.mimetype.split("/")[1];
        const filePath = path.join(tempFolder, `${message.id.id}.${fileExt}`);
        fs.writeFileSync(filePath, media.data, "base64");

        try {
          userInput = await transcribeVoice(filePath);
          console.log("📝 Transcribed voice:", userInput);
        } catch (err) {
          console.error("❌ Whisper transcription error:", err);
          await message.reply("⚠️ Could not transcribe voice message.");
          return;
        }
      }
    }

    const inputForGrok = pdfText || userInput || "Describe this content";

    // Save user input
    chatHistory[userId].push({ role: "user", content: inputForGrok });

    // Keep last 10 messages only
    if (chatHistory[userId].length > 10) {
      chatHistory[userId] = chatHistory[userId].slice(-10);
    }

    // AI Response with history
    const aiResponse = await getGrokResponseWithHistory(chatHistory[userId], imageUrl);

    // Save AI response
    chatHistory[userId].push({ role: "assistant", content: aiResponse });

    // Send text
    await message.reply(aiResponse);

    // Send voice
    // NOTE: Language detection is not implemented, default to 'en'
    await sendVoiceResponse(client, message.from, aiResponse);

  } catch (err) {
    console.error("❌ Message handler error:", err.message);
  }
});

// --------------------------- INITIALIZE ---------------------------
client.initialize();