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

export default function UploadPanel({
  file, docStats, onFileSelect, onAnalyze, loading,
  qaAnswer, qaLoading, onAskQuestion, hasResults,
}) {
  const [question, setQuestion] = useState('');

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

  const handleAsk = () => {
    if (question.trim()) {
      onAskQuestion(question.trim());
      setQuestion('');
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
