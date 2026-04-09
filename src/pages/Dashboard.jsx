import React, { useState, useEffect, useMemo } from 'react';

const Dashboard = ({ analysisHistory }) => {
  const [timeRange, setTimeRange] = useState('all'); // 'week', 'month', 'all'
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Calculate stats from history
  const stats = useMemo(() => {
    if (!analysisHistory || analysisHistory.length === 0) {
      return {
        totalDocuments: 0,
        avgWords: 0,
        avgReadingTime: 0,
        sentimentDistribution: {},
        docTypeDistribution: {},
        languageDistribution: {},
        riskTrends: { high: 0, medium: 0, low: 0 },
        topKeywords: [],
      };
    }

    const totalDocs = analysisHistory.length;
    const totalWords = analysisHistory.reduce((sum, doc) => sum + (doc.words || 0), 0);
    const totalReadTime = analysisHistory.reduce((sum, doc) => sum + (doc.readingMinutes || 0), 0);

    // Sentiment distribution
    const sentimentDist = {};
    analysisHistory.forEach(doc => {
      if (doc.sentiment?.label) {
        sentimentDist[doc.sentiment.label] = (sentimentDist[doc.sentiment.label] || 0) + 1;
      }
    });

    // Document type distribution
    const docTypeDist = {};
    analysisHistory.forEach(doc => {
      if (doc.docType?.type) {
        docTypeDist[doc.docType.type] = (docTypeDist[doc.docType.type] || 0) + 1;
      }
    });

    // Language distribution
    const langDist = {};
    analysisHistory.forEach(doc => {
      if (doc.language?.language) {
        langDist[doc.language.language] = (langDist[doc.language.language] || 0) + 1;
      }
    });

    // Risk trends
    const riskTrends = { high: 0, medium: 0, low: 0 };
    analysisHistory.forEach(doc => {
      if (doc.riskFlags && Array.isArray(doc.riskFlags)) {
        doc.riskFlags.forEach(risk => {
          if (risk.severity) {
            riskTrends[risk.severity] = (riskTrends[risk.severity] || 0) + 1;
          }
        });
      }
    });

    // Top keywords
    const keywordCounts = {};
    analysisHistory.forEach(doc => {
      if (doc.keywords && Array.isArray(doc.keywords)) {
        doc.keywords.forEach(kw => {
          keywordCounts[kw.toLowerCase()] = (keywordCounts[kw.toLowerCase()] || 0) + 1;
        });
      }
    });

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    return {
      totalDocuments: totalDocs,
      avgWords: Math.round(totalWords / totalDocs),
      avgReadingTime: Math.round(totalReadTime / totalDocs),
      sentimentDistribution: sentimentDist,
      docTypeDistribution: docTypeDist,
      languageDistribution: langDist,
      riskTrends,
      topKeywords,
    };
  }, [analysisHistory]);

  if (!stats || stats.totalDocuments === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-empty">
          <div className="empty-icon">📊</div>
          <h2>Analytics Dashboard</h2>
          <p>Analyze some documents first to see insights here</p>
        </div>
      </div>
    );
  }

  const getRiskLevelColor = (level) => {
    switch(level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const getSentimentColor = (label) => {
    switch(label) {
      case 'Positive': return '#10b981';
      case 'Negative': return '#ef4444';
      case 'Neutral': return '#94a3b8';
      default: return '#64748b';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <span className="title-icon">📊</span>
          <div>
            <h1>Manager's Insights Dashboard</h1>
            <p>Document Analysis Intelligence System</p>
          </div>
        </div>
        
        <div className="dashboard-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '8px 16px',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Time</option>
            <option value="month">Last 30 Days</option>
            <option value="week">Last 7 Days</option>
          </select>

          <div className="metric-tabs">
            {['overview', 'risks', 'sentiment', 'keywords'].map(metric => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                style={{
                  padding: '8px 16px',
                  background: selectedMetric === metric ? 'var(--accent)' : 'var(--surface2)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: selectedMetric === metric ? '#0d0f14' : 'var(--muted2)',
                  fontSize: 12,
                  fontWeight: selectedMetric === metric ? 600 : 400,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                }}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📄</div>
          <div className="metric-content">
            <div className="metric-value">{stats.totalDocuments}</div>
            <div className="metric-label">Total Documents</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📝</div>
          <div className="metric-content">
            <div className="metric-value">{stats.avgWords.toLocaleString()}</div>
            <div className="metric-label">Avg Words/Doc</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-value">{stats.avgReadingTime}m</div>
            <div className="metric-label">Avg Read Time</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <div className="metric-value">
              {stats.riskTrends.high + stats.riskTrends.medium}
            </div>
            <div className="metric-label">Total Risks</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {selectedMetric === 'overview' && (
          <>
            {/* Document Type Distribution */}
            <div className="dashboard-section">
              <h3>📊 Document Types</h3>
              <div className="chart-container">
                {Object.entries(stats.docTypeDistribution).map(([type, count]) => (
                  <div key={type} className="chart-bar">
                    <div className="bar-label">{type}</div>
                    <div className="bar-track">
                      <div 
                        className="bar-fill"
                        style={{
                          width: `${(count / stats.totalDocuments) * 100}%`,
                          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                        }}
                      />
                    </div>
                    <div className="bar-value">{count} ({Math.round((count / stats.totalDocuments) * 100)}%)</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="dashboard-section">
              <h3>😊 Sentiment Analysis</h3>
              <div className="sentiment-grid">
                {Object.entries(stats.sentimentDistribution).map(([label, count]) => (
                  <div key={label} className="sentiment-card">
                    <div 
                      className="sentiment-indicator"
                      style={{ background: getSentimentColor(label) }}
                    />
                    <div className="sentiment-info">
                      <div className="sentiment-value">{count}</div>
                      <div className="sentiment-label">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Distribution */}
            {Object.keys(stats.languageDistribution).length > 0 && (
              <div className="dashboard-section">
                <h3>🌐 Languages</h3>
                <div className="language-tags">
                  {Object.entries(stats.languageDistribution).map(([lang, count]) => (
                    <div key={lang} className="language-tag">
                      <span className="lang-name">{lang}</span>
                      <span className="lang-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {selectedMetric === 'risks' && (
          <div className="dashboard-section">
            <h3>⚠️ Risk Analysis</h3>
            
            {/* Risk Summary */}
            <div className="risk-summary">
              <div className="risk-stat">
                <div className="risk-count high">{stats.riskTrends.high}</div>
                <div className="risk-label">High Risk</div>
              </div>
              <div className="risk-stat">
                <div className="risk-count medium">{stats.riskTrends.medium}</div>
                <div className="risk-label">Medium Risk</div>
              </div>
              <div className="risk-stat">
                <div className="risk-count low">{stats.riskTrends.low}</div>
                <div className="risk-label">Low Risk</div>
              </div>
            </div>

            {/* Risk Distribution Chart */}
            <div className="risk-chart">
              {Object.entries(stats.riskTrends).map(([severity, count]) => (
                count > 0 && (
                  <div key={severity} className="risk-bar">
                    <div className="risk-bar-label">{severity.toUpperCase()}</div>
                    <div className="risk-bar-track">
                      <div 
                        className="risk-bar-fill"
                        style={{
                          width: `${(count / (stats.riskTrends.high + stats.riskTrends.medium + stats.riskTrends.low)) * 100}%`,
                          background: getRiskLevelColor(severity),
                        }}
                      />
                    </div>
                    <div className="risk-bar-value">{count}</div>
                  </div>
                )
              ))}
            </div>

            <div className="insight-box">
              <div className="insight-icon">💡</div>
              <div className="insight-text">
                <strong>Risk Insights:</strong> 
                {stats.riskTrends.high > 0 && ` ${stats.riskTrends.high} high-risk items detected. `}
                Review documents with high-risk flags immediately.
                {stats.riskTrends.medium > stats.riskTrends.high && ` Medium risks are the most common (${stats.riskTrends.medium}). Monitor these closely.`}
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'sentiment' && (
          <div className="dashboard-section">
            <h3>😊 Sentiment Trends</h3>
            
            {/* Sentiment Overview */}
            <div className="sentiment-overview">
              {Object.entries(stats.sentimentDistribution).map(([label, count]) => (
                <div key={label} className="sentiment-overview-item">
                  <div 
                    className="sentiment-circle"
                    style={{ 
                      background: getSentimentColor(label),
                      width: `${Math.max(60, (count / stats.totalDocuments) * 120)}px`,
                      height: `${Math.max(60, (count / stats.totalDocuments) * 120)}px`,
                    }}
                  >
                    <div className="circle-content">
                      <div className="circle-value">{count}</div>
                      <div className="circle-label">{label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="insight-box">
              <div className="insight-icon">💡</div>
              <div className="insight-text">
                <strong>Sentiment Analysis:</strong>
                {stats.sentimentDistribution['Positive'] > stats.sentimentDistribution['Negative'] 
                  ? ' Overall document sentiment is positive, indicating favorable content.'
                  : stats.sentimentDistribution['Negative'] > stats.sentimentDistribution['Positive']
                  ? ' Negative sentiment detected. Review documents for potential issues.'
                  : ' Sentiment is mostly neutral, suggesting factual/objective content.'}
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'keywords' && (
          <div className="dashboard-section">
            <h3>🏷️ Top Keywords</h3>
            
            <div className="keywords-cloud">
              {stats.topKeywords.map((kw, index) => (
                <div 
                  key={index}
                  className="keyword-item"
                  style={{
                    fontSize: `${Math.max(12, 20 - index * 1.5)}px`,
                    fontWeight: index < 3 ? 700 : 500,
                    opacity: 1 - (index * 0.08),
                  }}
                >
                  {kw.keyword}
                  <span className="keyword-count">({kw.count})</span>
                </div>
              ))}
            </div>

            <div className="insight-box">
              <div className="insight-icon">💡</div>
              <div className="insight-text">
                <strong>Keyword Insights:</strong>
                {stats.topKeywords.length > 0 && ` Most frequent keyword: "${stats.topKeywords[0].keyword}" (${stats.topKeywords[0].count} occurrences). `}
                These keywords represent the main themes across all analyzed documents.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section recent-activity">
        <h3>🕐 Recent Activity</h3>
        <div className="activity-list">
          {analysisHistory.slice(0, 5).map((doc, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">📄</div>
              <div className="activity-info">
                <div className="activity-name">{doc.name}</div>
                <div className="activity-meta">
                  {doc.words?.toLocaleString()} words • {doc.readingMinutes}m read time
                </div>
              </div>
              <div className="activity-time">{doc.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;