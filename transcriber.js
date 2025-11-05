// import fs from "fs";
// import fetch from "node-fetch";
// import path from "path";


// async function generateVoice(text, outputFile) {
//     const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
    
//     const response = await fetch(url, {
//         method: "POST",
//         headers: {
//             "Authorization": `Bearer ${HF_TOKEN}`,
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             inputs: text,
//             options: { use_cache: false }
//         })
//     });

//     if (!response.ok) {
//         console.error("❌ Hugging Face TTS error:", await response.text());
//         return null;
//     }

//     const arrayBuffer = await response.arrayBuffer();
//     fs.writeFileSync(outputFile, Buffer.from(arrayBuffer));
//     return outputFile;
// }

// // Example usage
// (async () => {
//     const output = path.join(process.cwd(), "temp", "response.wav");
//     const file = await generateVoice("Namaste! Meeru ela unnaaru?", output);
//     console.log("Voice saved at:", file);
// })();


import { execFile } from "child_process";
import path from "path";
import fs from "fs";

async function transcribeWithMMS(audioFilePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "mms_infer.py");

    execFile("python", [scriptPath, audioFilePath], (error, stdout, stderr) => {
      if (error) {
        console.error("❌ MMS transcription error:", stderr || error.message);
        return reject(error);
      }
      resolve(stdout.trim());
    });
  });
}

// Example usage
(async () => {
  const audioPath = path.join(process.cwd(), "voice.ogg");
  const transcription = await transcribeWithMMS(audioPath);
  console.log("📝 Transcription:", transcription);
})();
