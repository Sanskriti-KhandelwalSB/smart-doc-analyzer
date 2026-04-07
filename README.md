# 🔍 Smart Document Analyzer — AI Powered

> Upload any PDF, DOCX, or TXT file → Get instant AI-powered analysis using **FREE Groq AI**.

![Demo](https://img.shields.io/badge/AI-Groq%20%7C%20Llama3-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![Free](https://img.shields.io/badge/Cost-100%25%20Free-success)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📝 **Summary** | 4–6 sentence document summary |
| ✅ **Key Points** | Top 5–7 most important points |
| ⚠️ **Risk Flags** | Risks with severity (High/Medium/Low) |
| 📋 **Action Items** | Checkable task list extracted from doc |
| 📊 **Sentiment** | Visual sentiment gauge with explanation |
| 💬 **Q&A Chat** | Ask any question about your document |
| 📥 **Export Results** | Download analysis as TXT or JSON |
| 📋 **History** | Track recently analyzed documents |
| 🌓 **Dark/Light Mode** | Toggle between themes for comfort |


---

## 🚀 Quick Setup (5 minutes)

### Step 1 — Get Free Groq API Key

1. Go to **[https://console.groq.com](https://console.groq.com)**
2. Sign up — **no credit card needed**
3. Click **"API Keys"** → **"Create API Key"**
4. Copy your key

> 🎁 Groq gives you **14,400 free requests/day** using Llama3-8b

---

### Step 2 — Add Your Key

Open `.env` in the project root and paste your key:

```env
REACT_APP_GROQ_API_KEY=gsk_your_actual_key_here
```

---

### Step 3 — Install & Run

```bash
# Open this folder in VS Code terminal

# Install dependencies
npm install

# Start the app
npm start
```

The app opens at **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
smart-doc-analyzer/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── UploadPanel.jsx     ← File upload + Q&A sidebar
│   │   └── ResultCards.jsx     ← All result card components
│   ├── utils/
│   │   ├── groqService.js      ← FREE Groq AI integration
│   │   └── extractText.js      ← PDF/DOCX/TXT text extractor
│   ├── styles/
│   │   └── App.css             ← All styles
│   ├── App.jsx                 ← Main app component
│   └── index.js                ← Entry point
├── .env                        ← Your API key goes here
├── .env.example                ← Key format reference
├── package.json
└── README.md
```

---

## 🛠 Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React 18 + CSS | Free |
| AI Engine | Groq API (Llama3-8b) | **Free** |
| PDF Reading | pdfjs-dist | Free |
| DOCX Reading | mammoth.js | Free |
| File Upload | react-dropzone | Free |

---

## 📄 Supported File Types

- **PDF** — any PDF document
- **DOCX** — Microsoft Word documents
- **TXT** — plain text files
- **MD** — Markdown files

---

## 🔧 Troubleshooting

**"No API key" warning shows**
→ Make sure your `.env` file has the key and restart `npm start`

**PDF text comes out garbled**
→ The PDF might be image-based (scanned). Try a text-based PDF.

**API rate limit error**
→ Groq free tier: 14,400 requests/day, 30 requests/minute. Wait a moment and retry.

**App won't start**
→ Run `npm install` first, then `npm start`

---

## 💡 How It Works

```
User uploads file
      ↓
Text extracted (PDF.js / Mammoth / FileReader)
      ↓
Text sent to Groq API (Llama3-8b model)
      ↓
6 parallel AI analyses run:
  → Summary
  → Key Points  
  → Risk Flags
  → Action Items
  → Sentiment
  → Q&A (on demand)
      ↓
Results displayed as beautiful cards
```

---

## 🎯 Tips for Best Results

- **Contracts/Legal docs** → Great for risk flag detection
- **Reports/Research** → Summary + key points work best
- **Meeting notes** → Action items extraction is very accurate
- **Emails/Letters** → Sentiment analysis works perfectly

---

Made with using React + Groq AI (Free Llama3)
