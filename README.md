# 🔍 Smart Document Analyzer — AI Powered

> Upload any PDF, DOCX, or TXT file → Get instant AI-powered analysis using **FREE Groq AI**.

![Demo](https://img.shields.io/badge/AI-Groq%20%7C%20Llama3-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![Free](https://img.shields.io/badge/Cost-100%25%20Free-success)

---

## ✨ Features

### Core Analysis
| Feature | Description |
|---|---|
| 📝 **Summary** | 4–6 sentence document summary |
| ✅ **Key Points** | Top 5–7 most important points |
| ⚠️ **Risk Flags** | Risks with severity (High/Medium/Low) |
| 📋 **Action Items** | Checkable task list extracted from doc |
| 📊 **Sentiment** | Visual sentiment gauge with explanation |
| 💬 **Q&A Chat** | Ask any question about your document |
| 🏷️ **Document Type** | Auto-detect document type with confidence |
| 🌐 **Language Detection** | Identify document language |

### Advanced Analysis (New!)
| Feature | Description |
|---|---|
| 🏷️ **Keywords & Tags** | Auto-extract important keywords as tags |
| 📖 **Reading Level** | Analyze document complexity and readability |
| 🎯 **Topic Modeling** | Identify main topics with relevance scores |
| ✅ **Compliance Check** | Check for potential compliance issues |
| ⚖️ **Document Comparison** | Compare two documents side-by-side |
| 🔎 **Full-Text Search** | Search for keywords within documents |
| 🖨️ **Print Report** | Generate clean, printable reports |

### Productivity Features
| Feature | Description |
|---|---|
| 📥 **Export Results** | Download analysis as TXT or JSON |
| 📋 **History** | Track recently analyzed documents |
| 🌓 **Dark/Light Mode** | Toggle between themes for comfort |
| ⚡ **Fast Analysis** | Parallel AI processing for speed |
| 📄 **Multi-Format Support** | PDF, DOCX, TXT, MD files |

---

## 🚀 Quick Setup (5 minutes)

### Step 1 — Get Free Groq API Key

1. Go to **[https://console.groq.com](https://console.groq.com)**
2. Sign up — **no credit card needed**
3. Click **"API Keys"** → **"Create API Key"**
4. Copy your key

> 🎁 Groq gives you **14,400 free requests/day** using Llama3-70b

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
│   │   ├── UploadPanel.jsx     ← File upload + Q&A + new features sidebar
│   │   └── ResultCards.jsx     ← All result card components (14 cards!)
│   ├── utils/
│   │   ├── groqService.js      ← FREE Groq AI integration (14 AI functions)
│   │   └── extractText.js      ← PDF/DOCX/TXT text extractor
│   ├── styles/
│   │   └── App.css             ← All styles (dark/light themes)
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
| AI Engine | Groq API (Llama3-70b) | **Free** |
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

## 🎯 Use Cases

### For Professionals
- **Legal Teams**: Analyze contracts for risks and compliance
- **Project Managers**: Extract action items from meeting notes
- **Researchers**: Summarize papers and identify key findings
- **HR Teams**: Screen resumes and analyze candidate profiles

### For Students
- **Study Aid**: Summarize long articles and research papers
- **Writing Tool**: Check reading level and complexity
- **Research**: Extract key topics and concepts

### For Businesses
- **Document Processing**: Automate document analysis workflows
- **Compliance**: Check documents for regulatory compliance
- **Comparison**: Compare contract versions or proposals

---

## 🔧 Advanced Features Guide

### 1. Advanced Analysis Mode
Toggle "Advanced Analysis" before clicking Analyze to enable:
- Keyword extraction with colorful tags
- Reading level analysis with complexity metrics
- Topic modeling with relevance scores
- Compliance checking based on document type

### 2. Document Comparison
1. Upload and analyze your first document
2. Click "Compare Documents" to activate comparison mode
3. Upload a second document
4. Click "Compare Documents" button
5. View similarities, differences, and overall similarity score

### 3. Full-Text Search
After analysis, use the search box to:
- Find specific keywords or phrases
- See context around each match
- Navigate through multiple matches

### 4. Print-Friendly Reports
Click "Print Report" to generate a clean, formatted report that includes:
- Document metadata
- All analysis results
- Professional formatting
- Print-optimized layout

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

**Comparison not working**
→ Make sure both documents are uploaded and the first document has been analyzed

---

## 💡 How It Works

```
User uploads file
      ↓
Text extracted (PDF.js / Mammoth / FileReader)
      ↓
Text sent to Groq API (Llama3-70b model)
      ↓
Parallel AI analyses run:
  → Summary
  → Key Points  
  → Risk Flags
  → Action Items
  → Sentiment
  → Document Type
  → Language
  → [Advanced] Keywords
  → [Advanced] Reading Level
  → [Advanced] Topics
  → [Advanced] Compliance
      ↓
Results displayed as beautiful cards
      ↓
Optional: Compare with another document
      ↓
Export or Print results
```

---

## 🎯 Tips for Best Results

- **Contracts/Legal docs** → Great for risk flag detection and compliance
- **Reports/Research** → Summary + key points + topic modeling work best
- **Meeting notes** → Action items extraction is very accurate
- **Emails/Letters** → Sentiment analysis works perfectly
- **Academic Papers** → Reading level and keyword extraction are excellent
- **Multiple Versions** → Use comparison to track changes

---

## 📊 AI Models Used

All analysis powered by **Groq's free Llama3-70b model**:
- **Speed**: Up to 500 tokens/second
- **Quality**: 70 billion parameters
- **Cost**: 100% free (14,400 requests/day)
- **Reliability**: Enterprise-grade uptime

---

## 🔄 Recent Updates (v2.0)

### New Features Added:
✅ Keyword extraction with visual tags  
✅ Reading level analysis with complexity metrics  
✅ Topic modeling with relevance scores  
✅ Document comparison mode  
✅ Full-text search  
✅ Print-friendly reports  
✅ Compliance checking  
✅ Enhanced export options  

### Improved:
✅ Parallel processing for faster analysis  
✅ Better error handling and rate limit management  
✅ Enhanced UI with new card components  
✅ Dark/Light theme improvements  
✅ Mobile-responsive design  

---

## 🤝 Contributing

This is an open-source project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share your use cases

---

## 📝 License

MIT License - Feel free to use for personal or commercial projects.

---

Made with ❤️ using React + Groq AI (Free Llama3-70b)

**Ready to analyze your documents? Get your free API key and start now!** 🚀