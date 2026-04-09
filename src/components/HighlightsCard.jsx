import React, { useState } from 'react';

// ── HIGHLIGHTS CARD ────────────────────────────────────
export function HighlightsCard({ highlights }) {
  const [selectedHighlight, setSelectedHighlight] = useState(null);

  if (!highlights || (!highlights.risks?.length && !highlights.actions?.length && 
      !highlights.dates?.length && !highlights.entities?.length)) {
    return null;
  }

  const COLORS = {
    risks: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#f87171' },
    actions: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
    dates: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
    entities: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', text: '#a78bfa' },
  };

  const ICONS = {
    risks: '⚠️',
    actions: '✅',
    dates: '📅',
    entities: '👤',
  };

  const LABELS = {
    risks: 'Risks',
    actions: 'Action Items',
    dates: 'Dates & Deadlines',
    entities: 'People & Organizations',
  };

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🎯</span> Smart Highlights
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          Click to view details
        </span>
      </div>
      <div className="card-body">
        {Object.entries(highlights).map(([category, items]) => {
          if (!items || items.length === 0) return null;
          const color = COLORS[category];
          const icon = ICONS[category];
          const label = LABELS[category];

          return (
            <div key={category} style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 600,
                color: color.text,
              }}>
                <span>{icon}</span>
                <span>{label} ({items.length})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {items.map((item, index) => (
                  <span
                    key={index}
                    onClick={() => setSelectedHighlight({ ...item, category, label, icon })}
                    style={{
                      padding: '4px 10px',
                      background: color.bg,
                      border: `1px solid ${color.border}`,
                      borderRadius: '6px',
                      fontSize: 12,
                      color: 'var(--text)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      borderLeft: `3px solid ${color.text}`,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = `${color.bg}88`;
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = color.bg;
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    {item.text.length > 40 ? item.text.substring(0, 40) + '...' : item.text}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Detail Popup */}
        {selectedHighlight && (
          <div style={{
            marginTop: 16,
            padding: 16,
            background: 'var(--surface2)',
            border: `1px solid ${COLORS[selectedHighlight.category]?.border}`,
            borderLeft: `4px solid ${COLORS[selectedHighlight.category]?.text}`,
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>{selectedHighlight.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {selectedHighlight.label}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8, lineHeight: 1.6 }}>
              <strong>Text:</strong> {selectedHighlight.text}
            </div>
            {selectedHighlight.explanation && (
              <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6 }}>
                <strong>AI Analysis:</strong> {selectedHighlight.explanation}
              </div>
            )}
            {selectedHighlight.context && (
              <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6, marginTop: 4 }}>
                <strong>Context:</strong> {selectedHighlight.context}
              </div>
            )}
            {selectedHighlight.severity && (
              <div style={{ marginTop: 8 }}>
                <span style={{
                  fontSize: 10,
                  padding: '3px 8px',
                  background: selectedHighlight.severity === 'high' ? 'rgba(239,68,68,0.2)' :
                             selectedHighlight.severity === 'medium' ? 'rgba(245,158,11,0.2)' :
                             'rgba(16,185,129,0.2)',
                  color: selectedHighlight.severity === 'high' ? '#f87171' :
                         selectedHighlight.severity === 'medium' ? '#fbbf24' :
                         '#34d399',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}>
                  {selectedHighlight.severity} priority
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── DEADLINES CARD ─────────────────────────────────────
export function DeadlinesCard({ deadlines, onExportCalendar }) {
  if (!deadlines || deadlines.length === 0) return null;

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#f87171' };
      case 'medium': return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' };
      case 'low': return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#34d399' };
      default: return { bg: 'var(--surface2)', border: 'var(--border2)', text: 'var(--muted)' };
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getDaysUntil = (days) => {
    if (days < 0) return { text: `${Math.abs(days)} days ago`, color: '#ef4444' };
    if (days === 0) return { text: 'Today!', color: '#f59e0b' };
    if (days <= 7) return { text: `${days} days left`, color: '#f59e0b' };
    return { text: `${days} days left`, color: '#10b981' };
  };

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">📅</span> Deadlines & Calendar
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {deadlines.length} dates found
        </span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deadlines.map((deadline, index) => {
            const color = getSeverityColor(deadline.severity);
            const daysInfo = getDaysUntil(deadline.daysUntil);

            return (
              <div
                key={index}
                style={{
                  padding: 14,
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  borderLeft: `4px solid ${color.text}`,
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      {deadline.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>
                      {deadline.description}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      {formatDate(deadline.date)}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      color: daysInfo.color,
                      fontFamily: 'var(--font-mono)',
                      marginTop: 2,
                    }}>
                      {daysInfo.text}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      background: color.text + '20',
                      color: color.text,
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}>
                      {deadline.severity}
                    </span>
                    {deadline.action && (
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
                        → {deadline.action}
                      </span>
                    )}
                  </div>

                  {onExportCalendar && (
                    <button
                      onClick={() => onExportCalendar(deadline)}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#0d0f14',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(110,231,183,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      📅 Add to Calendar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div style={{ marginTop: 16, padding: 12, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            📊 Deadline Summary
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
            <span>
              <span style={{ color: '#f87171', fontWeight: 600 }}>
                {deadlines.filter(d => d.severity === 'high').length}
              </span> High Priority
            </span>
            <span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                {deadlines.filter(d => d.severity === 'medium').length}
              </span> Medium Priority
            </span>
            <span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                {deadlines.filter(d => d.severity === 'low').length}
              </span> Low Priority
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}