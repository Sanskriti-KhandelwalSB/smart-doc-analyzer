import React, { useState, useCallback, useEffect } from 'react';
import './styles/App.css';
import UploadPanel from './components/UploadPanel';
import {
  SummaryCard,
  KeyPointsCard,
  RiskFlagsCard,
  ActionItemsCard,
  SentimentCard,
  ProgressPanel,
  DocumentTypeCard,
  LanguageCard,
} from './components/ResultCards';
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
} from './utils/groqService';

// ── Local Storage Keys ──
const STORAGE_KEYS = {
  HISTORY: 'docanalyzer_history',
  THEME: 'docanalyzer_theme',
};

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

  // Q&A
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaLoading, setQaLoading] = useState(false);

  // History
  const [history, setHistory] = useState(() => getFromStorage(STORAGE_KEYS.HISTORY, []));
  const [showHistory, setShowHistory] = useState(false);

  // Theme
  const [darkMode, setDarkMode] = useState(() => getFromStorage(STORAGE_KEYS.THEME, true));

  const hasResults = summary || keyPoints.length > 0;

  // ── Apply theme ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    saveToStorage(STORAGE_KEYS.THEME, darkMode);
  }, [darkMode]);

  // ── Save to history when analysis completes ──
  const addToHistory = useCallback((fileName, stats) => {
    const entry = {
      id: Date.now(),
      name: fileName,
      date: new Date().toLocaleString(),
      words: stats?.words || 0,
      readingMinutes: stats?.readingMinutes || 0,
    };
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 10); // Keep last 10
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
      setQaAnswer('');
      setProgress(0);
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setSummary(''); setKeyPoints([]); setRisks([]); setActionItems([]); setSentiment(null);
    setDocType(null); setLanguage(null);
    setQaAnswer('');
    try {
      const text = await extractText(selectedFile);
      setDocText(text);
      setDocStats(getDocStats(text));
    } catch (err) {
      setError(`Could not read file: ${err.message}`);
    }
  };

  // ── Main analysis ────────────────────────────────────
  const handleAnalyze = async () => {
    if (!docText) return;
    setLoading(true);
    setError('');
    setProgress(0);
    setSummary(''); setKeyPoints([]); setRisks([]); setActionItems([]); setSentiment(null);
    // Clear entities removed

    try {
      setCurrentStep('extract');
      setProgress(5);
      await delay(300);

      // Run all analyses in parallel for better performance
      setCurrentStep('summary');
      setProgress(10);
      
      const [sum, pts, rsk, acts, sent, dtype, lang] = await Promise.all([
        getSummary(docText).then(result => { setSummary(result); setProgress(25); return result; }),
        getKeyPoints(docText).then(result => { setKeyPoints(result); setProgress(40); return result; }),
        getRiskFlags(docText).then(result => { setRisks(result); setProgress(55); return result; }),
        getActionItems(docText).then(result => { setActionItems(result); setProgress(70); return result; }),
        getSentiment(docText).then(result => { setSentiment(result); setProgress(80); return result; }),
        getDocumentType(docText).then(result => { setDocType(result); setProgress(90); return result; }),
        getLanguage(docText).then(result => { setLanguage(result); setProgress(97); return result; }),
      ]);

      setCurrentStep('done');
      setProgress(100);
      
      // Add to history
      addToHistory(file.name, docStats);
      
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
        <div className="history-sidebar">
          <div className="history-header">
            <span>📋 Analysis History</span>
            {history.length > 0 && (
              <button className="clear-history-btn" onClick={clearHistory}>Clear All</button>
            )}
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
      )}

      {/* ── MAIN ── */}
      <div className="main-layout">
        {/* LEFT — Upload & Controls */}
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
        />

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
      </div>
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
