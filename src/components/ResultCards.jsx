import React, { useState } from 'react';

// ── SUMMARY CARD ──────────────────────────────────────
export function SummaryCard({ summary }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">📝</span> Summary
        </div>
        <button className="copy-btn" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="card-body">
        <p className="summary-text">{summary}</p>
      </div>
    </div>
  );
}

// ── KEY POINTS CARD ───────────────────────────────────
export function KeyPointsCard({ points }) {
  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">✅</span> Key Points
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {points.length} found
        </span>
      </div>
      <div className="card-body">
        <ul className="key-points-list">
          {points.map((point, i) => (
            <li key={i} className="key-point">
              <span className="kp-num">#{String(i + 1).padStart(2, '0')}</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── RISK FLAGS CARD ───────────────────────────────────
export function RiskFlagsCard({ risks }) {
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...risks].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">⚠️</span> Risk Flags
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {risks.length} identified
        </span>
      </div>
      <div className="card-body">
        {risks.length === 0 ? (
          <div className="no-risk">✅ No significant risks identified</div>
        ) : (
          <div className="risk-list">
            {sorted.map((r, i) => (
              <div key={i} className={`risk-item ${r.severity}`}>
                <span className="risk-badge">{r.severity?.toUpperCase()}</span>
                <span>{r.risk}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ACTION ITEMS CARD ─────────────────────────────────
export function ActionItemsCard({ items }) {
  const [checked, setChecked] = useState([]);

  const toggle = (i) => {
    setChecked((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">📋</span> Action Items
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {checked.length}/{items.length} done
        </span>
      </div>
      <div className="card-body">
        {items.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>
            No action items found
          </div>
        ) : (
          <div className="action-list">
            {items.map((item, i) => (
              <div
                key={i}
                className={`action-item${checked.includes(i) ? ' checked' : ''}`}
                onClick={() => toggle(i)}
              >
                <div className="action-check">
                  {checked.includes(i) && (
                    <span style={{ color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>✓</span>
                  )}
                </div>
                <span className="action-text">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SENTIMENT CARD ────────────────────────────────────
const SENTIMENT_COLORS = {
  'Very Positive': '#10b981',
  'Positive': '#34d399',
  'Neutral': '#94a3b8',
  'Negative': '#f59e0b',
  'Very Negative': '#ef4444',
};

export function SentimentCard({ sentiment }) {
  const { label, score, explanation } = sentiment;
  const color = SENTIMENT_COLORS[label] || '#94a3b8';
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">📊</span> Sentiment Analysis
        </div>
      </div>
      <div className="card-body">
        <div className="sentiment-layout">
          {/* Circular gauge */}
          <div className="sentiment-dial">
            <svg width="100" height="100" viewBox="0 0 100 100">
              {/* Track */}
              <circle
                cx="50" cy="50" r={radius}
                fill="none"
                stroke="var(--surface3)"
                strokeWidth="8"
              />
              {/* Fill */}
              <circle
                cx="50" cy="50" r={radius}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="sentiment-score">
              <div className="sent-num" style={{ color }}>{score}</div>
              <div className="sent-pct">/100</div>
            </div>
          </div>

          <div className="sentiment-info">
            <div className="sentiment-label" style={{ color }}>{label}</div>
            <div className="sentiment-explanation">{explanation}</div>
          </div>
        </div>

        {/* Bar scale */}
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--surface2)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #ef4444, #f59e0b, #94a3b8, #34d399, #10b981)' }} />
            <div
              style={{
                position: 'absolute',
                left: `${score}%`,
                top: '50%',
                transform: 'translate(-50%,-50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#fff',
                border: `2px solid ${color}`,
                boxShadow: `0 0 6px ${color}44`,
                transition: 'left 1s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            <span>Very Negative</span><span>Neutral</span><span>Very Positive</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PROGRESS PANEL ────────────────────────────────────
const STEPS = [
  { key: 'extract', label: 'Extracting text from document' },
  { key: 'summary', label: 'Generating summary' },
  { key: 'points', label: 'Finding key points' },
  { key: 'risks', label: 'Scanning for risks' },
  { key: 'actions', label: 'Identifying action items' },
  { key: 'sentiment', label: 'Analyzing sentiment' },
];

export function ProgressPanel({ currentStep, progress = 0 }) {
  const stepIdx = STEPS.findIndex((s) => s.key === currentStep);
  const currentLabel = stepIdx >= 0 ? STEPS[stepIdx].label : 'Initializing...';
  
  return (
    <div className="progress-panel">
      <div className="progress-title">
        <div className="spinner" />
        Analyzing your document…
      </div>
      
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
        <span className="progress-percentage">{progress}%</span>
      </div>
      
      <div className="current-step-label">{currentLabel}</div>
      
      <div className="progress-steps">
        {STEPS.map((step, i) => {
          const isDone = i < stepIdx;
          const isActive = step.key === currentStep;
          return (
            <div
              key={step.key}
              className={`progress-step${isDone ? ' done' : isActive ? ' active' : ''}`}
            >
              <span className="step-icon">
                {isDone ? '✓' : isActive ? '⋯' : '○'}
              </span>
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DOCUMENT TYPE CARD ─────────────────────────────────
const DOC_TYPE_ICONS = {
  'Contract': '📜',
  'Report': '📊',
  'Email': '📧',
  'Letter': '✉️',
  'Invoice': '🧾',
  'Resume': '👤',
  'Article': '📰',
  'Research Paper': '🎓',
  'Meeting Notes': '📝',
  'Legal Document': '⚖️',
  'Financial Document': '💰',
  'Other': '📄',
};

export function DocumentTypeCard({ docType }) {
  const icon = DOC_TYPE_ICONS[docType?.type] || '📄';
  
  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🏷️</span> Document Type
        </div>
        {docType?.confidence && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {docType.confidence}% confidence
          </span>
        )}
      </div>
      <div className="card-body">
        <div className="doc-type-content">
          <div className="doc-type-icon">{icon}</div>
          <div className="doc-type-info">
            <div className="doc-type-label">{docType?.type || 'Unknown'}</div>
            {docType?.description && (
              <div className="doc-type-description">{docType.description}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LANGUAGE CARD ──────────────────────────────────────
export function LanguageCard({ language }) {
  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🌐</span> Language
        </div>
        {language?.confidence && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {language.confidence}% confidence
          </span>
        )}
      </div>
      <div className="card-body">
        <div className="language-content">
          <span className="language-name">{language?.language || 'Unknown'}</span>
          {language?.code && (
            <span className="language-code">[{language.code.toUpperCase()}]</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ENTITIES CARD ──────────────────────────────────────
const ENTITY_TYPE_COLORS = {
  person: '#3b82f6',
  organization: '#8b5cf6',
  date: '#f59e0b',
  money: '#10b981',
  location: '#ef4444',
};

const ENTITY_TYPE_ICONS = {
  person: '👤',
  organization: '🏢',
  date: '📅',
  money: '💰',
  location: '📍',
};

export function EntitiesCard({ entities }) {
  if (!entities || entities.length === 0) {
    return (
      <div className="result-card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-icon">🏷️</span> Key Entities
          </div>
        </div>
        <div className="card-body">
          <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>
            No entities extracted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🏷️</span> Key Entities
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {entities.length} found
        </span>
      </div>
      <div className="card-body">
        <div className="entities-grid">
          {entities.map((entity, i) => {
            const color = ENTITY_TYPE_COLORS[entity.type] || '#64748b';
            const icon = ENTITY_TYPE_ICONS[entity.type] || '📌';
            return (
              <div key={i} className="entity-tag" style={{ borderLeftColor: color }}>
                <span className="entity-icon">{icon}</span>
                <div className="entity-info">
                  <span className="entity-name">{entity.name}</span>
                  <span className="entity-type" style={{ color }}>{entity.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
