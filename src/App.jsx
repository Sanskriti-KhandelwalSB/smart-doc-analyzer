import React, { useState, useCallback, useEffect } from 'react';
import './styles/App.css';
import UploadPanel from './components/UploadPanel';
import Dashboard from './pages/Dashboard';
import {
  SummaryCard,
  KeyPointsCard,
  RiskFlagsCard,
  ActionItemsCard,
  SentimentCard,
  ProgressPanel,
  DocumentTypeCard,
  LanguageCard,
  KeywordsCard,
  ReadingLevelCard,
  TopicsCard,
  ComplianceCard,
  ComparisonCard,
} from './components/ResultCards';
import { HighlightsCard } from './components/HighlightsCard';
import { DeadlinesCard } from './components/HighlightsCard';
import { extractText, getDocStats } from './utils/extractText';
import {
  getSummary,
  getKeyPoints,
  getRiskFlags,
  getActionItems,
  getSentiment,
  askQuestion,
  getDocumentType,
  getLanguage,
  getKeywords,
  getReadingLevel,
  getTopics,
  compareDocuments,
  checkCompliance,
  extractHighlights,
  extractDeadlines,
  generateCalendarEvent,
} from './utils/groqService';

// ── Local Storage Keys ──
const STORAGE_KEYS = {
  HISTORY: 'docanalyzer_history',
  THEME: 'docanalyzer_theme',
  CACHE: 'docanalyzer_cache',
};

// ── Simple Hash Function for File Content ──
async function hashFileContent(text, analysisMode = 'basic', showAdvanced = false) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text + analysisMode + showAdvanced);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Helper: Get from localStorage safely ──
const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// ── Helper: Save to localStorage safely ──
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage not available:', e);
  }
};

export default function App() {
  const [file, setFile] = useState(null);
  const [docText, setDocText] = useState('');
  const [docStats, setDocStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  // Results
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);
  const [risks, setRisks] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [docType, setDocType] = useState(null);
  const [language, setLanguage] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [readingLevel, setReadingLevel] = useState(null);
  const [topics, setTopics] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [highlights, setHighlights] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  
  // Comparison mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareFile2, setCompareFile2] = useState(null);
  const [compareText2, setCompareText2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  
  // Print mode
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  // Analysis mode toggle
  const [analysisMode, setAnalysisMode] = useState('basic'); // 'lite', 'basic', 'advanced'
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Q&A
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaLoading, setQaLoading] = useState(false);

  // History
  const [history, setHistory] = useState(() => getFromStorage(STORAGE_KEYS.HISTORY, []));
  const [showHistory, setShowHistory] = useState(false);

  // Theme
  const [darkMode, setDarkMode] = useState(() => getFromStorage(STORAGE_KEYS.THEME, true));
  
  // Current view
  const [currentView, setCurrentView] = useState('analyzer'); // 'analyzer' or 'dashboard'

  const hasResults = summary || keyPoints.length > 0;
  const hasComparison = comparisonResult !== null;

  // ── Apply theme ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    saveToStorage(STORAGE_KEYS.THEME, darkMode);
  }, [darkMode]);

  // ── Save to history when analysis completes ──
  const addToHistory = useCallback((fileName, stats, analysisData) => {
    const entry = {
      id: Date.now(),
      name: fileName,
      date: new Date().toLocaleString(),
      words: stats?.words || 0,
      readingMinutes: stats?.readingMinutes || 0,
      sentences: stats?.sentences || 0,
      chars: stats?.chars || 0,
      // Store analysis results for dashboard
      sentiment: analysisData?.sentiment,
      docType: analysisData?.docType,
      language: analysisData?.language,
      riskFlags: analysisData?.risks,
      keywords: analysisData?.keywords,
    };
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 20); // Keep last 20
      saveToStorage(STORAGE_KEYS.HISTORY, updated);
      return updated;
    });
  }, []);

  // ── Handle file select ───────────────────────────────
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) {
      // Clear everything when removing file
      setFile(null);
      setDocText('');
      setDocStats(null);
      setError('');
      setSummary(''); setKeyPoints([]); setRisks([]); setActionItems([]); setSentiment(null);
      setDocType(null); setLanguage(null);
      setKeywords([]); setReadingLevel(null); setTopics([]); setCompliance([]);
      setQaAnswer('');
      setProgress(0);
      setComparisonResult(null);
      setCompareFile2(null);
      setCompareText2('');
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setSummary(''); setKeyPoints([]); setRisks([]); setActionItems([]); setSentiment(null);
    setDocType(null); setLanguage(null);
    setKeywords([]); setReadingLevel(null); setTopics([]); setCompliance([]);
    setHighlights(null); setDeadlines([]);
    setQaAnswer('');
    setKeywords([]); setReadingLevel(null); setTopics([]); setCompliance([]);
    setHighlights(null); setDeadlines([]);
    setQaAnswer('');
    setComparisonResult(null);
    try {
      const text = await extractText(selectedFile);
      setDocText(text);
      setDocStats(getDocStats(text));
    } catch (err) {
      setError(`Could not read file: ${err.message}`);
    }
  };

  // ── Handle compare file select ───────────────────────
  const handleCompareFileSelect = async (selectedFile) => {
    if (!selectedFile) {
      setCompareFile2(null);
      setCompareText2('');
      setComparisonResult(null);
      return;
    }
    setCompareFile2(selectedFile);
    try {
      const text = await extractText(selectedFile);
      setCompareText2(text);
    } catch (err) {
      setError(`Could not read compare file: ${err.message}`);
    }
  };

  // ── Run comparison ───────────────────────────────────
  const handleCompare = async () => {
    if (!docText || !compareText2) return;
    setCompareLoading(true);
    setComparisonResult(null);
    try {
      const result = await compareDocuments(docText, compareText2);
      setComparisonResult(result);
    } catch (err) {
      setError(`Comparison failed: ${err.message}`);
    } finally {
      setCompareLoading(false);
    }
  };

  // ── Search in document ───────────────────────────────
  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery.trim() || !docText) return;
    const query = searchQuery.toLowerCase();
    const words = docText.toLowerCase().split(/\s+/);
    const matches = [];
    const windowSize = 50;
    
    for (let i = 0; i < words.length; i++) {
      if (words[i].includes(query)) {
        const start = Math.max(0, i - windowSize);
        const end = Math.min(words.length, i + windowSize);
        const context = words.slice(start, end).join(' ');
        matches.push({
          context: `...${context}...`,
          position: i
        });
      }
    }
    
    setSearchResults(matches.slice(0, 10));
    // Keep the search query in the input field after searching
    // The searchQuery state is already managed by the parent component
  };

  // ── Print handler ────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // ── Get cached analysis ──────────────────────────────
  const getCachedAnalysis = async (text) => {
    try {
      const hash = await hashFileContent(text, analysisMode, showAdvanced);
      const cache = getFromStorage(STORAGE_KEYS.CACHE, {});
      return cache[hash] || null;
    } catch {
      return null;
    }
  };

  // ── Save to cache ────────────────────────────────────
  const saveToCache = async (text, results) => {
    try {
      const hash = await hashFileContent(text, analysisMode, showAdvanced);
      const cache = getFromStorage(STORAGE_KEYS.CACHE, {});
      cache[hash] = {
        ...results,
        cachedAt: new Date().toISOString(),
      };
      // Keep cache size manageable (max 20 entries)
      const entries = Object.entries(cache);
      if (entries.length > 20) {
        const sorted = entries.sort((a, b) => 
          new Date(b[1].cachedAt) - new Date(a[1].cachedAt)
        );
        const trimmed = Object.fromEntries(sorted.slice(0, 20));
        saveToStorage(STORAGE_KEYS.CACHE, trimmed);
      } else {
        saveToStorage(STORAGE_KEYS.CACHE, cache);
      }
    } catch (e) {
      console.log('Cache save failed:', e.message);
    }
  };

  // ── Main analysis ────────────────────────────────────
  const handleAnalyze = async () => {
    if (!docText) return;
    setLoading(true);
    setError('');
    setProgress(0);
    setSummary(''); setKeyPoints([]); setRisks([]); setActionItems([]); setSentiment(null);
    setKeywords([]); setReadingLevel(null); setTopics([]); setCompliance([]);
    setHighlights(null); setDeadlines([]);

    try {
      setCurrentStep('extract');
      setProgress(5);
      await delay(300);

      // Check cache first
      const cached = await getCachedAnalysis(docText);
      
      // Validate cached results - only use if they have actual content
      const hasValidCache = cached && (
        (cached.summary && cached.summary.length > 10) || 
        (cached.keyPoints && cached.keyPoints.length > 0) ||
        (cached.risks && cached.risks.length > 0) ||
        (cached.actionItems && cached.actionItems.length > 0) ||
        (cached.highlights && (cached.highlights.risks?.length > 0 || cached.highlights.actions?.length > 0 || cached.highlights.dates?.length > 0)) ||
        (cached.deadlines && cached.deadlines.length > 0)
      );
      
      if (hasValidCache) {
        // Use cached results
        console.log('Using cached analysis results', cached);
        
        // Update all state with cached data
        const summaryData = cached.summary || '';
        const keyPointsData = cached.keyPoints || [];
        
        setSummary(summaryData);
        setKeyPoints(keyPointsData);
        setRisks(cached.risks || []);
        setActionItems(cached.actionItems || []);
        setSentiment(cached.sentiment || null);
        setDocType(cached.docType || null);
        setLanguage(cached.language || null);
        setKeywords(cached.keywords || []);
        setReadingLevel(cached.readingLevel || null);
        setTopics(cached.topics || []);
        setCompliance(cached.compliance || []);
        setHighlights(cached.highlights || null);
        setDeadlines(cached.deadlines || []);
        setCurrentStep('done');
        setProgress(100);
        
        // Add to history even for cached results
        addToHistory(file.name, docStats, {
          sentiment: cached.sentiment,
          docType: cached.docType,
          language: cached.language,
          risks: cached.risks,
          keywords: cached.keywords,
          highlights: cached.highlights,
          deadlines: cached.deadlines,
        });
        
        console.log('Cache loaded successfully. hasResults should be:', !!summaryData || keyPointsData.length > 0);
        
        await delay(500);
        setLoading(false);
        return; // Skip API calls
      } else if (cached) {
        console.log('Cache found but invalid (empty results), running fresh analysis');
      }


      // Run all analyses in parallel for better performance
      setCurrentStep('summary');
      setProgress(10);
      
      const analysisPromises = [
        getSummary(docText).then(result => { setSummary(result); setProgress(20); return result; }),
        getKeyPoints(docText).then(result => { setKeyPoints(result); setProgress(30); return result; }),
        getRiskFlags(docText).then(result => { setRisks(result); setProgress(40); return result; }),
        getActionItems(docText).then(result => { setActionItems(result); setProgress(50); return result; }),
        getSentiment(docText).then(result => { setSentiment(result); setProgress(55); return result; }),
        getDocumentType(docText).then(result => { setDocType(result); setProgress(60); return result; }),
        getLanguage(docText).then(result => { setLanguage(result); setProgress(65); return result; }),
      ];

      // Add analyses based on mode
      if (analysisMode === 'advanced' || showAdvanced) {
        console.log('🔍 Running Advanced Mode analysis - including highlights and deadlines');
        analysisPromises.push(
          getKeywords(docText).then(result => { setKeywords(result); setProgress(70); return result; }),
          getReadingLevel(docText).then(result => { setReadingLevel(result); setProgress(75); return result; }),
          getTopics(docText).then(result => { setTopics(result); setProgress(80); return result; }),
          extractHighlights(docText).then(result => { 
            console.log('🎯 Highlights result:', result); 
            setHighlights(result); 
            setProgress(85); 
            return result; 
          }),
          extractDeadlines(docText).then(result => { 
            console.log('📅 Deadlines result:', result); 
            setDeadlines(result); 
            setProgress(90); 
            return result; 
          }),
        );
      } else if (analysisMode === 'basic') {
        console.log('📊 Running Basic Mode analysis - keywords only');
        // Basic mode: add only keywords and compliance
        analysisPromises.push(
          getKeywords(docText).then(result => { setKeywords(result); setProgress(70); return result; }),
        );
      } else {
        console.log('🟢 Running Lite Mode analysis - core features only');
      }
      // Lite mode: only core analysis (summary, key points, risks, actions, sentiment)

      // Wait for all analysis promises to complete and collect results
      const results = await Promise.all(analysisPromises);
      
      // Run compliance check if we have a document type and mode supports it
      let complianceResult = [];
      if ((analysisMode === 'advanced' || showAdvanced) && docType) {
        try {
          const comp = await checkCompliance(docText, docType.type);
          setCompliance(comp);
          complianceResult = comp;
        } catch (e) {
          console.log('Compliance check skipped:', e.message);
        }
      }

      setCurrentStep('done');
      setProgress(100);
      
      // Save to cache for future use using the actual results from promises
      await saveToCache(docText, {
        summary: results[0] || summary,
        keyPoints: results[1] || keyPoints,
        risks: results[2] || risks,
        actionItems: results[3] || actionItems,
        sentiment: results[4] || sentiment,
        docType: results[5] || docType,
        language: results[6] || language,
        keywords: results[7] || keywords,
        readingLevel: results[8] || readingLevel,
        topics: results[9] || topics,
        compliance: complianceResult,
        highlights: results[10] || highlights,
        deadlines: results[11] || deadlines,
      });
      
      // Add to history
      addToHistory(file.name, docStats, {
        sentiment,
        docType,
        language,
        risks,
        keywords,
        highlights,
        deadlines,
      });
      
      await delay(500);
    } catch (err) {
      if (err.message === 'NO_KEY') {
        setError('No Groq API key found. Add your key to the .env file. Get a free key at console.groq.com');
      } else {
        setError(`Analysis failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Q&A ──────────────────────────────────────────────
  const handleAskQuestion = async (question) => {
    if (!docText) return;
    setQaLoading(true);
    setQaAnswer('');
    try {
      const answer = await askQuestion(docText, question);
      setQaAnswer(answer);
    } catch (err) {
      setQaAnswer(`Error: ${err.message}`);
    } finally {
      setQaLoading(false);
    }
  };

  // ── Copy All Results ─────────────────────────────────
  const handleCopyAll = async () => {
    if (!hasResults) return;
    
    let content = `SMART DOCUMENT ANALYSIS REPORT\n`;
    content += `================================\n\n`;
    content += `Document: ${file?.name || 'Unknown'}\n`;
    content += `Analyzed: ${new Date().toLocaleString()}\n`;
    content += `Words: ${docStats?.words || 0} | Reading Time: ${docStats?.readingMinutes || 0} min\n\n`;
    if (docType) content += `Document Type: ${docType.type} (${docType.confidence}% confidence)\n\n`;
    if (language) content += `Language: ${language.language} [${language.code.toUpperCase()}] (${language.confidence}% confidence)\n\n`;
    content += `--- SUMMARY ---\n${summary}\n\n`;
    content += `--- KEY POINTS ---\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`;
    content += `--- RISK FLAGS ---\n${risks.map(r => `[${r.severity?.toUpperCase()}] ${r.risk}`).join('\n')}\n\n`;
    content += `--- ACTION ITEMS ---\n${actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n`;
    content += `--- SENTIMENT ---\n${sentiment?.label} (${sentiment?.score}/100)\n${sentiment?.explanation}\n`;
    
    try {
      await navigator.clipboard.writeText(content);
      alert('✅ All results copied to clipboard!');
    } catch {
      alert('❌ Failed to copy to clipboard');
    }
  };

  // ── Generate Print Content ───────────────────────────
  const generatePrintContent = () => {
    let content = `
<!DOCTYPE html>
<html>
<head>
  <title>Document Analysis Report - ${file?.name || 'Unknown'}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 24px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .section { margin-bottom: 24px; }
    .tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 16px; margin: 4px; font-size: 13px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .risk-high { color: #dc2626; }
    .risk-medium { color: #f59e0b; }
    .risk-low { color: #10b981; }
    .sentiment { font-size: 18px; font-weight: bold; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>📝 Document Analysis Report</h1>
  <div class="meta">
    <strong>Document:</strong> ${file?.name || 'Unknown'}<br>
    <strong>Analyzed:</strong> ${new Date().toLocaleString()}<br>
    <strong>Words:</strong> ${docStats?.words || 0} | <strong>Reading Time:</strong> ${docStats?.readingMinutes || 0} min
    ${docType ? `<br><strong>Type:</strong> ${docType.type}` : ''}
    ${language ? `<br><strong>Language:</strong> ${language.language}` : ''}
  </div>
  
  ${summary ? `<div class="section"><h2>📝 Summary</h2><p>${summary}</p></div>` : ''}
  
  ${keyPoints.length > 0 ? `<div class="section"><h2>✅ Key Points</h2><ul>${keyPoints.map(p => `<li>${p}</li>`).join('')}</ul></div>` : ''}
  
  ${risks.length > 0 ? `<div class="section"><h2>⚠️ Risk Flags</h2><ul>${risks.map(r => `<li class="risk-${r.severity}">[${r.severity?.toUpperCase()}] ${r.risk}</li>`).join('')}</ul></div>` : ''}
  
  ${actionItems.length > 0 ? `<div class="section"><h2>📋 Action Items</h2><ul>${actionItems.map(a => `<li>${a}</li>`).join('')}</ul></div>` : ''}
  
  ${sentiment ? `<div class="section"><h2>📊 Sentiment</h2><p class="sentiment">${sentiment.label} (${sentiment.score}/100)</p><p>${sentiment.explanation}</p></div>` : ''}
  
  ${keywords.length > 0 ? `<div class="section"><h2>🏷️ Keywords</h2><div>${keywords.map(k => `<span class="tag">${k}</span>`).join('')}</div></div>` : ''}
  
  ${readingLevel ? `<div class="section"><h2>📖 Reading Level</h2><p><strong>${readingLevel.level}</strong> (Score: ${readingLevel.score}/100)</p><p>${readingLevel.description}</p></div>` : ''}
  
  ${topics.length > 0 ? `<div class="section"><h2>🎯 Topics</h2><ul>${topics.map(t => `<li><strong>${t.topic}</strong> (${t.relevance}% relevance)</li>`).join('')}</ul></div>` : ''}
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
    Generated by DocuMind AI - Smart Document Analyzer
  </div>
</body>
</html>`;
    return content;
  };

  // ── Export Results ───────────────────────────────────
  const handleExport = (format) => {
    if (!hasResults) return;
    
    let content = '';
    let filename = `analysis-${file?.name?.replace(/\.[^/.]+$/, '') || 'document'}-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'txt') {
      content = `SMART DOCUMENT ANALYSIS REPORT\n`;
      content += `================================\n\n`;
      content += `Document: ${file?.name || 'Unknown'}\n`;
      content += `Analyzed: ${new Date().toLocaleString()}\n`;
      content += `Words: ${docStats?.words || 0} | Reading Time: ${docStats?.readingMinutes || 0} min\n\n`;
      if (docType) content += `Document Type: ${docType.type} (${docType.confidence}% confidence)\n\n`;
      if (language) content += `Language: ${language.language} [${language.code.toUpperCase()}] (${language.confidence}% confidence)\n\n`;
      content += `--- SUMMARY ---\n${summary}\n\n`;
      content += `--- KEY POINTS ---\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`;
      content += `--- RISK FLAGS ---\n${risks.map(r => `[${r.severity?.toUpperCase()}] ${r.risk}`).join('\n')}\n\n`;
      content += `--- ACTION ITEMS ---\n${actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n`;
      content += `--- SENTIMENT ---\n${sentiment?.label} (${sentiment?.score}/100)\n${sentiment?.explanation}\n`;
      filename += '.txt';
    } else if (format === 'json') {
      content = JSON.stringify({
        document: file?.name,
        analyzedAt: new Date().toISOString(),
        stats: docStats,
        docType,
        language,
        summary,
        keyPoints,
        risks,
        actionItems,
        sentiment,
      }, null, 2);
      filename += '.json';
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Handle Calendar Export ───────────────────────────
  const handleExportCalendar = (deadline) => {
    const icsContent = generateCalendarEvent(deadline, file?.name || 'Document');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deadline-${deadline.title?.replace(/\s+/g, '-') || 'event'}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Handle Print Preview ─────────────────────────────
  const handlePrintPreview = () => {
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // ── Clear History ────────────────────────────────────
  const clearHistory = () => {
    setHistory([]);
    saveToStorage(STORAGE_KEYS.HISTORY, []);
  };

  // ── Load from History ────────────────────────────────
  const loadFromHistory = (entry) => {
    // Show a message that they need to re-upload the file
    alert(`To analyze "${entry.name}" again, please upload the file. History tracks analyzed documents for reference.`);
  };

  return (
    <div className="app">
      {/* ── TOPBAR ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div className="brand-name">DocuMind<span>AI</span></div>
        </div>
        
        <div className="topbar-actions">
          {/* Dashboard Toggle */}
          <button 
            className="topbar-btn"
            onClick={() => setCurrentView(currentView === 'analyzer' ? 'dashboard' : 'analyzer')}
            title={currentView === 'analyzer' ? 'View Dashboard' : 'View Analyzer'}
            style={{
              background: currentView === 'dashboard' ? 'var(--accent)' : 'var(--surface2)',
              color: currentView === 'dashboard' ? '#0d0f14' : 'var(--muted2)',
            }}
          >
            📊
          </button>
          
          {/* Theme Toggle */}
          <button 
            className="topbar-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {/* History Toggle */}
          <button 
            className="topbar-btn"
            onClick={() => setShowHistory(!showHistory)}
            title="View Analysis History"
          >
            📋
          </button>
          
          {/* Export (only when results exist) */}
          {hasResults && (
            <div className="export-dropdown">
              <button className="topbar-btn export-btn" title="Export Results">
                📥 Export
              </button>
              <div className="export-menu">
                <button onClick={() => handleExport('txt')}>📄 Export as TXT</button>
                <button onClick={() => handleExport('json')}>📊 Export as JSON</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── HISTORY SIDEBAR ── */}
      {showHistory && (
        <>
          {/* Overlay to close sidebar when clicking outside */}
          <div 
            className="history-overlay"
            onClick={() => setShowHistory(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 85,
              cursor: 'default',
            }}
          />
          <div className="history-sidebar" style={{ zIndex: 90 }}>
          <div className="history-header">
            <span>📋 Analysis History</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {history.length > 0 && (
                <button className="clear-history-btn" onClick={clearHistory}>Clear All</button>
              )}
              <button 
                onClick={() => setShowHistory(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '0 4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">No analysis history yet</div>
            ) : (
              history.map(entry => (
                <div 
                  key={entry.id} 
                  className="history-item"
                  onClick={() => loadFromHistory(entry)}
                  title="Click to view info"
                >
                  <div className="history-name">{entry.name}</div>
                  <div className="history-meta">
                    <span>{entry.words.toLocaleString()} words</span>
                    <span>•</span>
                    <span>{entry.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </>
      )}

      {/* ── MAIN ── */}
      <div className="main-layout">
        {/* Show Dashboard */}
        {currentView === 'dashboard' ? (
          <Dashboard analysisHistory={history} />
        ) : (
          /* LEFT — Upload & Controls */
          <>
          <div style={{
            width: '340px',
            flexShrink: 0,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}>
              <UploadPanel
          file={file}
          docStats={docStats}
          onFileSelect={handleFileSelect}
          onAnalyze={handleAnalyze}
          loading={loading}
          qaAnswer={qaAnswer}
          qaLoading={qaLoading}
          onAskQuestion={handleAskQuestion}
          hasResults={hasResults}
          // New props
          compareMode={compareMode}
          setCompareMode={setCompareMode}
          compareFile2={compareFile2}
          onCompareFileSelect={handleCompareFileSelect}
          onCompare={handleCompare}
          compareLoading={compareLoading}
          comparisonResult={comparisonResult}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          searchResults={searchResults}
          onPrintPreview={handlePrintPreview}
          analysisMode={analysisMode}
          setAnalysisMode={setAnalysisMode}
        />
          </div>

          {/* RIGHT — Results */}
          <div className="results-panel">
          {/* Welcome state */}
          {!file && !loading && (
            <div className="welcome-state">
              <div className="welcome-hero">
                <div className="welcome-hero-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div className="welcome-hero-title">DocuMind AI</div>
                <div className="welcome-hero-subtitle">Intelligent Document Analysis Platform</div>
              </div>
              
              <div className="welcome-sub">
                Transform any document into actionable insights with AI-powered analysis.
                Upload PDFs, Word documents, or text files to get instant comprehensive analysis.
              </div>
              
              <div className="welcome-steps">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-text">Upload Document</div>
                </div>
                <div className="step-connector"></div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-text">AI Analysis</div>
                </div>
                <div className="step-connector"></div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-text">Get Insights</div>
                </div>
              </div>
              
              <div className="welcome-features">
                {[
                  { icon: '📝', name: 'Summary', desc: 'AI-generated overview' },
                  { icon: '✅', name: 'Key Points', desc: 'Critical insights' },
                  { icon: '⚠️', name: 'Risk Flags', desc: 'Issue detection' },
                  { icon: '📋', name: 'Action Items', desc: 'Task extraction' },
                  { icon: '📊', name: 'Sentiment', desc: 'Tone analysis' },
                  { icon: '💬', name: 'Q&A Chat', desc: 'Interactive queries' },
                  { icon: '🏷️', name: 'Doc Type', desc: 'Auto-classification' },
                  { icon: '🌐', name: 'Language', desc: 'Language detection' },
                ].map((f) => (
                  <div key={f.name} className="welcome-feat">
                    <div className="feat-icon">{f.icon}</div>
                    <div className="feat-name">{f.name}</div>
                    <div className="feat-desc">{f.desc}</div>
                  </div>
                ))}
              </div>
              
              <div className="welcome-badges">
                <div className="badge-item">
                  <span className="badge-icon">⚡</span>
                  <span className="badge-text">Real-time Analysis</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">🔒</span>
                  <span className="badge-text">Secure Processing</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">🤖</span>
                  <span className="badge-text">Powered by Groq AI</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className="error-box">❌ {error}</div>}

          {/* Progress */}
          {loading && <ProgressPanel currentStep={currentStep} progress={progress} />}

          {/* Results Header with Copy All */}
          {hasResults && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -10 }}>
              <button 
                onClick={handleCopyAll}
                style={{
                  padding: '8px 16px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--muted2)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--muted2)'; }}
              >
                📋 Copy All Results
              </button>
            </div>
          )}

          {/* Results */}
          {!loading && docType && <DocumentTypeCard docType={docType} />}
          {!loading && language && <LanguageCard language={language} />}
          {!loading && summary && <SummaryCard summary={summary} />}
          {!loading && keyPoints.length > 0 && <KeyPointsCard points={keyPoints} />}
          {!loading && risks !== null && hasResults && <RiskFlagsCard risks={risks} />}
          {!loading && actionItems !== null && hasResults && <ActionItemsCard items={actionItems} />}
          {!loading && sentiment && <SentimentCard sentiment={sentiment} />}
          {!loading && keywords.length > 0 && <KeywordsCard keywords={keywords} />}
          {!loading && readingLevel && <ReadingLevelCard readingLevel={readingLevel} />}
          {!loading && topics.length > 0 && <TopicsCard topics={topics} />}
          {!loading && compliance.length > 0 && <ComplianceCard compliance={compliance} />}
          {!loading && highlights && <HighlightsCard highlights={highlights} />}
          {!loading && deadlines.length > 0 && <DeadlinesCard deadlines={deadlines} onExportCalendar={handleExportCalendar} />}
          {!loading && hasComparison && comparisonResult && <ComparisonCard comparison={comparisonResult} />}

          {/* File ready but not analyzed */}
          {file && !loading && !hasResults && !error && (
            <div className="welcome-state">
              <div className="welcome-art">📄</div>
              <div className="welcome-title">Document Ready</div>
              <div className="welcome-sub">
                Click <strong style={{ color: 'var(--accent)' }}>Analyze Document</strong> to run
                AI analysis — summary, key points, risks, action items & sentiment.
              </div>
            </div>
          )}
          </div>
          </>
        )}
      </div>
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
