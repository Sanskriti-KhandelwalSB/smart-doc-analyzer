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

// ── KEYWORDS CARD ──────────────────────────────────────
export function KeywordsCard({ keywords }) {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#6366f1'];

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🏷️</span> Keywords & Tags
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {keywords.length} keywords
        </span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {keywords.map((keyword, i) => (
            <span
              key={i}
              style={{
                padding: '6px 14px',
                background: `${COLORS[i % COLORS.length]}20`,
                color: COLORS[i % COLORS.length],
                borderRadius: '20px',
                fontSize: 13,
                fontWeight: 500,
                border: `1px solid ${COLORS[i % COLORS.length]}40`,
              }}
            >
              #{keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── READING LEVEL CARD ─────────────────────────────────
const LEVEL_COLORS = {
  'Elementary': '#10b981',
  'Middle School': '#34d399',
  'High School': '#f59e0b',
  'College': '#3b82f6',
  'Graduate': '#8b5cf6',
  'Expert': '#ec4899',
};

export function ReadingLevelCard({ readingLevel }) {
  if (!readingLevel) return null;
  
  const { level, score, description, avgSentenceLength, complexWordPercentage } = readingLevel;
  const color = LEVEL_COLORS[level] || '#3b82f6';
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">📖</span> Reading Level
        </div>
      </div>
      <div className="card-body">
        <div className="sentiment-layout">
          <div className="sentiment-dial">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle
                cx="45" cy="45" r={radius}
                fill="none"
                stroke="var(--surface3)"
                strokeWidth="7"
              />
              <circle
                cx="45" cy="45" r={radius}
                fill="none"
                stroke={color}
                strokeWidth="7"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="sentiment-score">
              <div className="sent-num" style={{ color, fontSize: 18 }}>{score}</div>
              <div className="sent-pct">/100</div>
            </div>
          </div>

          <div className="sentiment-info">
            <div className="sentiment-label" style={{ color, fontSize: 16 }}>{level}</div>
            <div className="sentiment-explanation" style={{ fontSize: 12 }}>{description}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{avgSentenceLength}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Avg Sentence Length</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{complexWordPercentage}%</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Complex Words</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TOPICS CARD ────────────────────────────────────────
export function TopicsCard({ topics }) {
  if (!topics || topics.length === 0) return null;

  const TOPIC_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🎯</span> Main Topics
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {topics.length} topics
        </span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topics.map((topic, i) => {
            const color = TOPIC_COLORS[i % TOPIC_COLORS.length];
            return (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{topic.topic}</span>
                  <span style={{ fontSize: 11, color, fontFamily: 'var(--font-mono)' }}>{topic.relevance}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${topic.relevance}%`,
                      background: color,
                      borderRadius: 3,
                      transition: 'width 1s ease',
                    }}
                  />
                </div>
                {topic.keywords && topic.keywords.length > 0 && (
                  <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {topic.keywords.map((kw, j) => (
                      <span key={j} style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── COMPLIANCE CARD ────────────────────────────────────
const STATUS_COLORS = {
  compliant: '#10b981',
  'non-compliant': '#ef4444',
  'needs-review': '#f59e0b',
};

export function ComplianceCard({ compliance }) {
  if (!compliance || compliance.length === 0) return null;

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">✅</span> Compliance Check
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {compliance.length} checks
        </span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {compliance.map((item, i) => {
            const statusColor = STATUS_COLORS[item.status] || '#64748b';
            return (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: 'var(--surface2)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${statusColor}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{item.category}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '3px 8px',
                      background: `${statusColor}20`,
                      color: statusColor,
                      borderRadius: 10,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {item.status}
                  </span>
                </div>
                {item.recommendation && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{item.recommendation}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── COMPARISON CARD ────────────────────────────────────
export function ComparisonCard({ comparison }) {
  if (!comparison) return null;

  const { similarities, differences, overallSimilarity, recommendation } = comparison;

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">⚖️</span> Document Comparison
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {overallSimilarity}% similar
        </span>
      </div>
      <div className="card-body">
        {/* Similarity Bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Overall Similarity</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{overallSimilarity}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${overallSimilarity}%`,
                background: `linear-gradient(90deg, var(--accent), #8b5cf6)`,
                borderRadius: 4,
                transition: 'width 1s ease',
              }}
            />
          </div>
        </div>

        {/* Similarities */}
        {similarities.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>
              ✓ Similarities ({similarities.length})
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
              {similarities.map((s, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Differences */}
        {differences.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>
              ⚠ Differences ({differences.length})
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
              {differences.map((d, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>💡 Recommendation</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{recommendation}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── RELATED DOCUMENTS CARD ─────────────────────────────
export function RelatedDocumentsCard({ relatedDocs, onSelect }) {
  if (!relatedDocs || relatedDocs.length === 0) return null;

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🔗</span> Related Documents
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {relatedDocs.length} found
        </span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {relatedDocs.map((doc, i) => (
            <div
              key={i}
              onClick={() => onSelect && onSelect(doc)}
              style={{
                padding: 12,
                background: 'var(--surface2)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--surface3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'var(--surface2)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>
                  {doc.similarityScore}% match
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Analyzed: {doc.date}
              </div>
              {doc.matchingKeywords && doc.matchingKeywords.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {doc.matchingKeywords.slice(0, 5).map((kw, j) => (
                    <span key={j} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--surface3)', borderRadius: 4, color: 'var(--accent)' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ANALYSIS STATISTICS CARD ───────────────────────────
export function AnalysisStatsCard({ stats }) {
  if (!stats) return null;

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">📊</span> Analysis Statistics
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {stats.totalDocuments} documents
        </span>
      </div>
      <div className="card-body">
        {/* Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{stats.avgWords}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>AVG WORDS</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent2)' }}>{stats.avgReadingTime}m</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>AVG READ TIME</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{stats.totalDocuments}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>DOCUMENTS</div>
          </div>
        </div>

        {/* Sentiment Distribution */}
        {Object.keys(stats.sentimentDistribution).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Sentiment Distribution</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(stats.sentimentDistribution).map(([label, count]) => (
                <div key={label} style={{ flex: 1, minWidth: 80, textAlign: 'center', padding: 8, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{count}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Keywords */}
        {stats.topKeywords.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Top Keywords</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {stats.topKeywords.map((kw, i) => (
                <span key={i} style={{
                  padding: '4px 10px',
                  background: `${'var(--accent)'}20`,
                  color: 'var(--accent)',
                  borderRadius: '16px',
                  fontSize: 11,
                  fontWeight: 500,
                }}>
                  {kw.keyword} ({kw.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DOCUMENT TEMPLATE CARD ─────────────────────────────
export function DocumentTemplateCard({ templates, selectedTemplate, onSelect }) {
  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">📋</span> Analysis Templates
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(templates).map(([key, template]) => (
            <div
              key={key}
              onClick={() => onSelect && onSelect(key)}
              style={{
                padding: 12,
                background: selectedTemplate === key ? 'var(--accent)' : 'var(--surface2)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: selectedTemplate === key ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                if (selectedTemplate !== key) {
                  e.currentTarget.style.background = 'var(--surface3)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTemplate !== key) {
                  e.currentTarget.style.background = 'var(--surface2)';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedTemplate === key ? '#0d0f14' : 'var(--text)' }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: 11, color: selectedTemplate === key ? 'rgba(13,15,20,0.7)' : 'var(--muted)', marginTop: 2 }}>
                    {template.description}
                  </div>
                </div>
                {selectedTemplate === key && (
                  <span style={{ fontSize: 16, color: '#0d0f14' }}>✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
