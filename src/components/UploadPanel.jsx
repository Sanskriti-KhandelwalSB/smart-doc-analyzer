import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const FILE_ICONS = { pdf: '📄', docx: '📝', txt: '📃', md: '📃' };

function getFileExt(name) {
  return name.split('.').pop().toLowerCase();
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Template descriptions
const TEMPLATE_DESCRIPTIONS = {
  contract: '📜 Focuses on legal terms, obligations, liabilities, termination clauses, and renewal terms. Includes compliance checks.',
  resume: '👤 Extracts skills, experience, education, certifications, and achievements. Highlights key qualifications.',
  report: '📊 Analyzes findings, conclusions, recommendations, and data insights. Identifies main topics and reading level.',
  meeting_notes: '📝 Extracts decisions made, action items assigned, deadlines, and responsible parties. Great for follow-ups.',
  research_paper: '🎓 Focuses on hypothesis, methodology, findings, contributions, and limitations. Academic-style analysis.',
};

export default function UploadPanel({
  file, docStats, onFileSelect, onAnalyze, loading,
  qaAnswer, qaLoading, onAskQuestion, hasResults,
  // New props
  compareMode, setCompareMode, compareFile2, onCompareFileSelect,
  onCompare, compareLoading, comparisonResult,
  showAdvanced, setShowAdvanced,
  searchQuery, setSearchQuery, onSearch, searchResults,
  onPrintPreview,
  analysisMode, setAnalysisMode,
}) {
  const [question, setQuestion] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const getTemplateDescription = (template) => {
    return TEMPLATE_DESCRIPTIONS[template] || 'General analysis with all available features.';
  };

  // Main document dropzone
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) onFileSelect(accepted[0]);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    multiple: false,
  });

  // Comparison document dropzone
  const onCompareDrop = useCallback((accepted) => {
    if (accepted[0]) onCompareFileSelect(accepted[0]);
  }, [onCompareFileSelect]);

  const { getRootProps: getCompareRootProps, getInputProps: getCompareInputProps, isDragActive: isCompareDragActive } = useDropzone({
    onDrop: onCompareDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    multiple: false,
  });

  const handleAsk = () => {
    if (question.trim()) {
      onAskQuestion(question.trim());
      // Keep the question in the input field after asking
      // setQuestion(''); // Commented out to keep question visible
    }
  };

  const hasKey = process.env.REACT_APP_GROQ_API_KEY &&
    process.env.REACT_APP_GROQ_API_KEY !== 'your_groq_api_key_here';

  return (
    <div className="upload-panel">
      {/* ── NO KEY WARNING ── */}
      {!hasKey && (
        <div className="no-key-banner">
          <div className="no-key-title">⚠ Groq API Key Missing</div>
          <div className="no-key-text">
            Get your free key at{' '}
            <a href="https://console.groq.com" target="_blank" rel="noreferrer">
              console.groq.com
            </a>
            {' '}and paste it in your <code>.env</code> file.
          </div>
        </div>
      )}

      {/* ── UPLOAD ── */}
      <div className="panel-section">
        <div className="panel-title">📂 Upload Document</div>

        {!file ? (
          <div {...getRootProps({ className: `dropzone${isDragActive ? ' active' : ''}` })}>
            <input {...getInputProps()} />
            <div className="dz-icon">📄</div>
            <div className="dz-title">
              {isDragActive ? 'Drop it here!' : 'Drop your document'}
            </div>
            <div className="dz-sub">or click to browse</div>
            <div className="dz-types">
              <span className="dz-type">.PDF</span>
              <span className="dz-type">.DOCX</span>
              <span className="dz-type">.TXT</span>
              <span className="dz-type">.MD</span>
            </div>
          </div>
        ) : (
          <div className="file-info">
            <div className="file-info-row">
              <div className="file-icon-box">
                {FILE_ICONS[getFileExt(file.name)] || '📄'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatSize(file.size)}</div>
              </div>
            </div>

            {docStats && (
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-num">{docStats.words.toLocaleString()}</div>
                  <div className="stat-lbl">Words</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{docStats.readingMinutes}m</div>
                  <div className="stat-lbl">Read time</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{docStats.sentences}</div>
                  <div className="stat-lbl">Sentences</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{(docStats.chars / 1000).toFixed(1)}k</div>
                  <div className="stat-lbl">Characters</div>
                </div>
              </div>
            )}
            
            {/* Remove File Button */}
            <button 
              className="remove-file-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Remove this document?')) {
                  onFileSelect(null);
                }
              }}
              title="Remove document"
            >
              🗑️ Remove
            </button>
          </div>
        )}
      </div>

      {/* ── ANALYSIS MODE SELECTOR ── */}
      {file && (
        <div className="panel-section">
          <div className="panel-title">⚡ Analysis Mode</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {/* Lite Mode */}
            <button
              onClick={() => setAnalysisMode('lite')}
              style={{
                padding: '10px 12px',
                background: analysisMode === 'lite' ? 'rgba(16,185,129,0.15)' : 'var(--surface2)',
                border: `2px solid ${analysisMode === 'lite' ? '#10b981' : 'var(--border2)'}`,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (analysisMode !== 'lite') { e.target.style.borderColor = '#10b981'; } }}
              onMouseLeave={(e) => { if (analysisMode !== 'lite') { e.target.style.borderColor = 'var(--border2)'; } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>🟢 Lite Mode</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
                    Summary + Key Points + Risks + Actions + Sentiment
                  </div>
                </div>
                {analysisMode === 'lite' && <span style={{ color: '#10b981', fontSize: 16 }}>✓</span>}
              </div>
            </button>

            {/* Basic Mode */}
            <button
              onClick={() => setAnalysisMode('basic')}
              style={{
                padding: '10px 12px',
                background: analysisMode === 'basic' ? 'rgba(59,130,246,0.15)' : 'var(--surface2)',
                border: `2px solid ${analysisMode === 'basic' ? '#3b82f6' : 'var(--border2)'}`,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (analysisMode !== 'basic') { e.target.style.borderColor = '#3b82f6'; } }}
              onMouseLeave={(e) => { if (analysisMode !== 'basic') { e.target.style.borderColor = 'var(--border2)'; } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>🔵 Basic Mode</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
                    Lite + Keywords + Doc Type + Language
                  </div>
                </div>
                {analysisMode === 'basic' && <span style={{ color: '#3b82f6', fontSize: 16 }}>✓</span>}
              </div>
            </button>

            {/* Advanced Mode */}
            <button
              onClick={() => setAnalysisMode('advanced')}
              style={{
                padding: '10px 12px',
                background: analysisMode === 'advanced' ? 'rgba(139,92,246,0.15)' : 'var(--surface2)',
                border: `2px solid ${analysisMode === 'advanced' ? '#8b5cf6' : 'var(--border2)'}`,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (analysisMode !== 'advanced') { e.target.style.borderColor = '#8b5cf6'; } }}
              onMouseLeave={(e) => { if (analysisMode !== 'advanced') { e.target.style.borderColor = 'var(--border2)'; } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>🟣 Advanced Mode</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
                    All features including Highlights, Deadlines, Topics, Compliance
                  </div>
                </div>
                {analysisMode === 'advanced' && <span style={{ color: '#8b5cf6', fontSize: 16 }}>✓</span>}
              </div>
            </button>
          </div>

          {/* Token usage indicator */}
          <div style={{ 
            padding: '8px', 
            background: 'var(--surface2)', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '11px', 
            color: 'var(--muted)',
            textAlign: 'center',
          }}>
            {analysisMode === 'lite' && '⚡ ~15K tokens • Fastest • Best for quick overviews'}
            {analysisMode === 'basic' && '📊 ~30K tokens • Balanced • Good for most documents'}
            {analysisMode === 'advanced' && '🔬 ~65K tokens • Comprehensive • Full document intelligence'}
          </div>
        </div>
      )}

      {/* ── ANALYZE ── */}
      {file && (
        <div className="panel-section">
          <button
            className="analyze-btn"
            onClick={onAnalyze}
            disabled={loading || !hasKey}
          >
            {loading ? '⏳ Analyzing…' : '🔍 Analyze Document'}
          </button>

          {/* Change file */}
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <button className="reset-btn">↩ Change File</button>
          </div>
        </div>
      )}

      {/* ── COMPARISON MODE ── */}
      {file && hasResults && (
        <div className="panel-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--muted2)', fontWeight: 500 }}>⚖️ Compare Documents</span>
            <button
              onClick={() => setCompareMode(!compareMode)}
              style={{
                padding: '6px 14px',
                background: compareMode ? 'var(--accent)' : 'var(--surface2)',
                border: 'none',
                borderRadius: '8px',
                color: compareMode ? '#fff' : 'var(--muted2)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
            >
              {compareMode ? '✓ Active' : 'Activate'}
            </button>
          </div>

          {compareMode && (
            <div style={{ marginTop: 12 }}>
              {!compareFile2 ? (
                <div {...getCompareRootProps({ className: 'dropzone-small' })}>
                  <input {...getCompareInputProps()} />
                  <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                    Drop 2nd document to compare
                  </div>
                </div>
              ) : (
                <div style={{ padding: 10, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {compareFile2.name}
                    </span>
                    <button
                      onClick={() => onCompareFileSelect(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 16,
                        padding: '0 4px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <button
                className="analyze-btn"
                onClick={onCompare}
                disabled={compareLoading || !compareFile2 || !hasKey}
                style={{ width: '100%', marginTop: 8 }}
              >
                {compareLoading ? '⏳ Comparing…' : '⚖️ Compare Documents'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SEARCH ── */}
      {hasResults && (
        <div className="panel-section">
          <div className="panel-title">🔎 Search in Document</div>
          <div className="qa-input-row">
            <input
              className="qa-input"
              placeholder="Search for keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
            <button
              className="qa-btn"
              onClick={onSearch}
              disabled={!searchQuery.trim()}
            >
              🔍
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginTop: 10, maxHeight: 200, overflowY: 'auto' }}>
              {searchResults.map((result, i) => (
                <div
                  key={i}
                  style={{
                    padding: 8,
                    background: 'var(--surface2)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 6,
                    fontSize: 11,
                    color: 'var(--muted)',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Match #{i + 1}:</span> {result.context}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRINT ── */}
      {hasResults && (
        <div className="panel-section">
          <button
            onClick={onPrintPreview}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--muted2)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted2)'; }}
          >
            🖨️ Print Report
          </button>
        </div>
      )}

      {/* ── Q&A ── */}
      {hasResults && (
        <div className="panel-section">
          <div className="panel-title">💬 Ask a Question</div>
          <div className="qa-input-row">
            <input
              className="qa-input"
              placeholder="e.g. What is the payment date?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            />
            <button
              className="qa-btn"
              onClick={handleAsk}
              disabled={qaLoading || !question.trim()}
            >
              {qaLoading ? '…' : '➤'}
            </button>
          </div>

          {qaLoading && (
            <div className="qa-answer" style={{ color: 'var(--muted)' }}>
              Thinking…
            </div>
          )}

          {qaAnswer && !qaLoading && (
            <div className="qa-answer">{qaAnswer}</div>
          )}

          {/* Quick questions */}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['What is the main purpose?', 'Who are the key parties?', 'What are the deadlines?'].map((q) => (
              <button
                key={q}
                onClick={() => onAskQuestion(q)}
                style={{
                  padding: '7px 11px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '7px',
                  color: 'var(--muted2)',
                  fontSize: 11,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => e.target.style.borderColor = 'var(--accent)'}
                onMouseLeave={(e) => e.target.style.borderColor = 'var(--border)'}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
