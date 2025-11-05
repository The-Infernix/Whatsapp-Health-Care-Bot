
---

# 🩺 Asha – AI Healthcare Assistant on WhatsApp

**Asha** is an **AI-powered multilingual healthcare chatbot** that works seamlessly on **WhatsApp**. She provides instant, reliable, and conversational health assistance — from giving wellness tips to analyzing reports, reading PDFs, understanding voice messages, and even detecting potential disease outbreaks.

> “Your personal health assistant, available 24/7 — right inside WhatsApp.”

---

## 🌟 Features

| Category                            | Description                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| 💬 **Chat-based Health Assistance** | Get preventive health advice, wellness tips, and guidance on symptoms through natural chat. |
| 🧠 **AI-Powered Understanding**     | Uses **LLM + NLP** to understand text, image, PDF, and voice inputs.                        |
| 📄 **Medical Report Analysis**      | Upload lab reports or PDFs — Asha reads, summarizes, and highlights key findings.           |
| 🩻 **Image Understanding**          | Upload X-rays or scans for basic analysis and health context.                               |
| 🗣️ **Voice Interaction**           | Speak naturally — Asha listens, transcribes, and replies using AI voice (TTS).              |
| 🌍 **Multilingual Support**         | Communicates in multiple Indian and global languages.                                       |
| 📊 **Disease Outbreak Awareness**   | Fetches live health alerts (like dengue or flu) and shares nearby outbreak info.            |
| 🔒 **Privacy Focused**              | No data shared externally — all processing is local or on secure endpoints.                 |

---

## 🧩 Tech Stack

| Component                    | Technology Used                     |
| ---------------------------- | ----------------------------------- |
| 💬 **Messaging Platform**    | WhatsApp Web + Selenium / Puppeteer |
| 🤖 **Bot Backend**           | Python + Flask                      |
| 🗣️ **Speech to Text (STT)** | OpenAI Whisper                      |
| 🔊 **Text to Speech (TTS)**  | Parler TTS / AI4Bharat Indic-TTS    |
| 🧠 **AI Core**               | OpenAI GPT / Custom Healthcare LLM  |
| 🧾 **PDF Parsing**           | PyMuPDF / LangChain Document Loader |
| 🖼️ **Image Analysis**       | Hugging Face Vision Models          |
| ☁️ **Deployment**            | Oracle Cloud / Localhost            |
| 💾 **Storage**               | Local File System + Temp Cache      |

---

## ⚙️ Setup Guide

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/asha-health-bot.git
cd asha-health-bot
```

### 2️⃣ Create and Activate Virtual Environment

```bash
conda create -n asha python=3.10
conda activate asha
```

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ Configure Environment Variables

Create a `.env` file in the root folder:

```
OPENAI_API_KEY=your_openai_key
WHATSAPP_NUMBER=your_number
```

### 5️⃣ Run the Bot

```bash
python main.py
```

When the WhatsApp QR code appears, scan it with your mobile WhatsApp → your bot “Asha” will start responding.

---

## 🎙️ Voice & TTS Setup

If TTS (Text-to-Speech) is required, ensure you’ve installed **Parler TTS**:

```bash
pip install parler-tts
```

If not available, fallback to **Option 2 (OpenAI TTS)** inside your script.

---

## 🧪 Example Interactions

**User:** “Hi Asha, I’m feeling tired and dizzy lately.”
**Asha:** “That could be due to dehydration, low blood sugar, or fatigue. Try drinking more water and resting. If it continues, consult a doctor.”

**User:** *Uploads a PDF medical report*
**Asha:** “I’ve analyzed your report. Your cholesterol levels are slightly elevated. You might want to reduce oily food and exercise regularly.”

**User:** *Sends a voice message:* “Asha, do I need a flu shot?”
**Asha:** “If it’s flu season or you’re at higher risk, a flu shot is recommended. I can share nearby vaccination centers if you’d like!”

---

## 🧠 Architecture Overview

```
User (WhatsApp)
     ↓
WhatsApp Web Interface
     ↓
Bot Core (Python + Flask)
     ├── Whisper STT  →  Transcribes voice
     ├── GPT / LLM    →  Generates text response
     ├── Parler TTS   →  Generates voice reply
     ├── PDF/Image AI →  Analyzes uploads
     ↓
Response (Text / Audio / Image)
```

---

## 🎥 Demo Video Script

In the demo, Asha interacts directly with the judges:

> “Hello judges! I’m Asha, your AI healthcare assistant. Let me show you how I can help...”

Asha then demonstrates:

1. Health advice via text.
2. PDF report reading.
3. Image (X-ray) understanding.
4. Voice conversation.
5. Multilingual chat (e.g., Spanish / Hindi).
6. Real-time outbreak awareness.

---

## 🚀 Future Improvements

* Doctor-on-call integration (verified experts).
* Personalized health record dashboard.
* Emergency chatbot assistant (SOS + GPS).
* Cloud-based analytics and health trends.

---

## 👩‍⚕️ Team

**Project Lead:** Infernix
**Tech Stack:** MERN, Python, AI/ML, Firebase, Whisper, Parler TTS

---

## 🛡️ License

This project is released under the **MIT License**.
Feel free to use, modify, and contribute with credit.

---

