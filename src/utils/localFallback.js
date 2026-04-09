// ─────────────────────────────────────────────────────────
//  localFallback.js  —  Local Rule-Based Analysis
//  Provides basic document analysis when APIs are unavailable
// ─────────────────────────────────────────────────────────

// ── Simple Summary (extract first few sentences) ─────────
export function getSummaryLocal(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summary = sentences.slice(0, 3).join('. ').trim();
  return summary || 'Unable to generate summary.';
}

// ── Extract Key Points (first sentence of paragraphs) ───
export function getKeyPointsLocal(text) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  const keyPoints = paragraphs
    .slice(0, 5)
    .map(p => {
      const firstSentence = p.split(/[.!?]+/)[0].trim();
      return firstSentence.length > 20 ? firstSentence : null;
    })
    .filter(Boolean)
    .slice(0, 5);
  return keyPoints.length > 0 ? keyPoints : ['No key points could be extracted.'];
}

// ── Detect Risk Flags (keyword-based) ────────────────────
export function getRiskFlagsLocal(text) {
  const riskKeywords = {
    high: ['must', 'required', 'obligated', 'liable', 'penalty', 'breach', 'termination', 'lawsuit', 'damages', 'indemnify'],
    medium: ['should', 'recommended', 'advisory', 'caution', 'risk', 'concern', 'issue', 'warning', 'review'],
    low: ['may', 'might', 'could', 'optional', 'consider', 'suggest', 'note', 'attention'],
  };

  const textLower = text.toLowerCase();
  const flags = [];

  for (const [severity, keywords] of Object.entries(riskKeywords)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        const context = textLower.split(keyword)[1]?.split('.')[0]?.substring(0, 50) || '';
        flags.push({
          risk: `Contains "${keyword}" - potential ${severity} risk`,
          severity: severity,
          context: context.trim() + '...'
        });
        if (flags.filter(f => f.severity === severity).length >= 2) break;
      }
    }
  }

  return flags.slice(0, 5);
}

// ── Extract Action Items (imperative sentences) ─────────
export function getActionItemsLocal(text) {
  const actionPatterns = [
    /(?:please|kindly|must|should|will|shall|need to|have to)\s+(?:be\s+)?(\w+)/i,
    /(?:action|required|responsible|deadline|due|complete|submit|review|approve)/i,
  ];

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const actions = [];

  for (const sentence of sentences) {
    for (const pattern of actionPatterns) {
      if (pattern.test(sentence)) {
        const action = sentence.trim().substring(0, 100);
        if (action.length > 15 && !actions.includes(action)) {
          actions.push(action);
        }
        break;
      }
    }
  }

  return actions.slice(0, 5).length > 0 
    ? actions.slice(0, 5) 
    : ['No specific action items detected.'];
}

// ── Detect Sentiment (keyword-based) ────────────────────
export function getSentimentLocal(text) {
  const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'achieve', 'benefit', 'improve', 'opportunity', 'growth', 'profit', 'gain', 'advantage'];
  const negativeWords = ['bad', 'poor', 'negative', 'fail', 'loss', 'risk', 'problem', 'issue', 'concern', 'decline', 'decrease', 'threat', 'weakness', 'error'];

  const textLower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) negativeCount += matches.length;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) return { label: 'Neutral', score: 50 };

  const score = Math.round((positiveCount / total) * 100);
  const label = score > 60 ? 'Positive' : score < 40 ? 'Negative' : 'Neutral';

  return { label, score };
}

// ── Detect Document Type (keyword-based) ─────────────────
export function getDocumentTypeLocal(text) {
  const typeKeywords = {
    'Contract': ['agreement', 'contract', 'party', 'terms', 'conditions', 'signatory', 'execute', 'binding'],
    'Email': ['from:', 'to:', 'subject:', 'dear', 'regards', 'sincerely', 'best regards'],
    'Report': ['report', 'executive summary', 'findings', 'conclusion', 'recommendation', 'analysis'],
    'Invoice': ['invoice', 'bill', 'payment', 'amount due', 'total', 'subtotal', 'tax'],
    'Resume': ['experience', 'education', 'skills', 'employment', 'qualification', 'degree', 'certification'],
    'Letter': ['dear', 'sincerely', 'yours truly', 'best regards', 'letter'],
    'Meeting Notes': ['meeting', 'attendees', 'agenda', 'action items', 'discussion', 'minutes'],
    'Legal Document': ['whereas', 'hereby', 'pursuant', 'herein', 'aforementioned', 'legal'],
    'Financial Document': ['financial', 'revenue', 'expense', 'balance sheet', 'income', 'cash flow'],
    'Research Paper': ['abstract', 'methodology', 'hypothesis', 'results', 'discussion', 'references'],
    'Article': ['article', 'published', 'author', 'journal', 'publication'],
  };

  const textLower = text.toLowerCase();
  let bestMatch = { type: 'Other', confidence: 30 };

  for (const [docType, keywords] of Object.entries(typeKeywords)) {
    let matchCount = 0;
    keywords.forEach(kw => {
      if (textLower.includes(kw)) matchCount++;
    });

    const confidence = Math.min(95, 30 + matchCount * 15);
    if (confidence > bestMatch.confidence) {
      bestMatch = { type: docType, confidence };
    }
  }

  return bestMatch;
}

// ── Detect Language (basic) ──────────────────────────────
export function getLanguageLocal(text) {
  // Check for common non-English patterns
  const patterns = {
    'Spanish': /[áéíóúüñ¿¡]/i,
    'French': /[àâçéèêëïîôùûüÿœ]/i,
    'German': /[äöüß]/i,
    'Portuguese': /[ãõçáéíóú]/i,
    'Italian': /[àèéìíòóù]/i,
    'Chinese': /[\u4e00-\u9fff]/,
    'Japanese': /[\u3040-\u309f\u30a0-\u30ff]/,
    'Arabic': /[\u0600-\u06ff]/,
  };

  for (const [language, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return { language, code: language.slice(0, 2).toLowerCase(), confidence: 80 };
    }
  }

  return { language: 'English', code: 'en', confidence: 70 };
}

// ── Extract Keywords (frequency-based) ───────────────────
export function getKeywordsLocal(text) {
  // Remove common stop words
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'if', 'while', 'that', 'this', 'these', 'those', 'it', 'its']);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  const frequency = {};
  words.forEach(w => {
    frequency[w] = (frequency[w] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

// ── Get Reading Level (basic heuristic) ──────────────────
export function getReadingLevelLocal(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1);
  
  // Simple readability estimate
  const score = Math.min(100, Math.max(0, 
    100 - (avgSentenceLength - 15) * 3 - (avgWordLength - 4) * 10
  ));

  let level = 'College';
  if (score > 80) level = 'High School';
  else if (score > 60) level = 'College';
  else if (score > 40) level = 'Graduate';
  else level = 'Expert';

  return { level, score: Math.round(score) };
}

// ── Full Local Analysis ─────────────────────────────────
export async function analyzeLocally(text, mode = 'basic') {
  console.log('🔄 Using local analysis (APIs unavailable)');
  
  const results = {
    summary: getSummaryLocal(text),
    keyPoints: getKeyPointsLocal(text),
    risks: getRiskFlagsLocal(text),
    actionItems: getActionItemsLocal(text),
    sentiment: getSentimentLocal(text),
    docType: getDocumentTypeLocal(text),
    language: getLanguageLocal(text),
    isLocalAnalysis: true,
  };

  if (mode === 'basic' || mode === 'advanced') {
    results.keywords = getKeywordsLocal(text);
  }

  if (mode === 'advanced') {
    results.readingLevel = getReadingLevelLocal(text);
    results.topics = []; // Topics require more advanced NLP
    results.highlights = { risks: [], actions: [], dates: [], entities: [] };
    results.deadlines = [];
    results.compliance = [];
  }

  return { success: true, data: results, isLocalAnalysis: true };
}

// ── Check if local fallback should be used ──────────────
export function shouldUseLocalFallback(error) {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || '';
  return msg.includes('rate limit') || 
         msg.includes('quota') || 
         msg.includes('429') ||
         msg.includes('both groq and gemini');
}