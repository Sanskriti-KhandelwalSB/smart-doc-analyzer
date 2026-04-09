// ─────────────────────────────────────────────────────────
//  groqService.js  —  FREE AI via Groq (llama-3.3-70b-versatile)
//  Get your free key at: https://console.groq.com
//  Includes rate limit handling with exponential backoff
// ─────────────────────────────────────────────────────────

import { retryWithBackoff } from './rateLimiter';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // Free model — more powerful, different rate limits

const getKey = () => process.env.REACT_APP_GROQ_API_KEY || '';

// ── Fetch Groq API (raw) ────────────────────────────────
async function fetchGroqAPI(systemPrompt, userPrompt, maxTokens = 512) {
  const key = getKey();
  if (!key || key === 'your_groq_api_key_here') {
    throw new Error('NO_KEY');
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorMsg = err?.error?.message || `API Error ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Rate Limit Handler with Exponential Backoff ─────────
// Optimized for lower token usage
async function callGroq(systemPrompt, userPrompt, maxTokens = 512, retries = 3) {
  // Check if all APIs are currently rate limited
  const { shouldSkipDueToRateLimit, getRateLimitResetTime, markAllApisRateLimited } = await import('./rateLimiter.js');
  
  if (shouldSkipDueToRateLimit()) {
    const waitTime = getRateLimitResetTime();
    const error = new Error(`All APIs are rate limited. Please wait ${Math.ceil(waitTime/1000)} seconds before trying again.`);
    error.isRateLimit = true;
    error.waitTime = waitTime;
    throw error;
  }

  // Create Gemini fallback function
  const geminiFallback = async () => {
    console.log('Switching to Gemini fallback...');
    try {
      const gemini = await import('./geminiService.js');
      useGeminiFallback = true;
      const result = await gemini.callGemini(userPrompt, maxTokens);
      console.log('✅ Gemini fallback successful!');
      return result;
    } catch (geminiError) {
      console.error('Gemini fallback failed:', geminiError.message);
      // Mark all APIs as rate limited to prevent immediate retry
      markAllApisRateLimited(60000); // 60 second cooldown
      throw new Error(`Both Groq and Gemini are rate limited. Please wait 60 seconds before trying again.`);
    }
  };

  try {
    const result = await retryWithBackoff(
      () => fetchGroqAPI(systemPrompt, userPrompt, maxTokens),
      'groq',
      {
        maxRetries: retries,
        fallbackFunction: geminiFallback,
      }
    );
    useGeminiFallback = false; // Reset fallback flag on success
    return result;
  } catch (error) {
    // Check if this is a rate limit error that should use local fallback
    const { shouldUseLocalFallback } = await import('./localFallback.js');
    if (shouldUseLocalFallback(error)) {
      error.useLocalFallback = true;
    }
    throw error;
  }
}

// ── Helper for Gemini fallback ──────────────────────────
async function callGeminiFallback(prompt, maxTokens) {
  try {
    const gemini = await import('./geminiService.js');
    useGeminiFallback = true;
    return await gemini.callGemini(prompt, maxTokens);
  } catch (error) {
    throw new Error(`Gemini fallback failed: ${error.message}`);
  }
}

// ── 1. SUMMARY ─────────────────────────────────────────
export async function getSummary(text) {
  const system = `Summarize in 2-3 sentences max.`;
  const user = `Summarize:\n\n${text.slice(0, 2000)}`; // Reduced text
  return callGroq(system, user, 200); // Reduced tokens
}

// ── 2. KEY POINTS ──────────────────────────────────────
export async function getKeyPoints(text) {
  const system = `Extract 3 key points max. Return ONLY JSON array of strings.`;
  const user = `Key points:\n\n${text.slice(0, 2000)}`; // Reduced text
  const raw = await callGroq(system, user, 200); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return raw
      .split('\n')
      .map((l) => l.replace(/^[-•*\d.]\s*/, '').trim())
      .filter((l) => l.length > 10)
      .slice(0, 5);
  }
}

// ── 3. RISK FLAGS ──────────────────────────────────────
export async function getRiskFlags(text) {
  const system = `Identify up to 2 key risks. Return ONLY JSON array with "risk" and "severity" keys.`;
  const user = `Risks:\n\n${text.slice(0, 2000)}`; // Reduced text
  const raw = await callGroq(system, user, 200); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── 4. ACTION ITEMS ────────────────────────────────────
export async function getActionItems(text) {
  const system = `Extract up to 3 action items. Return ONLY JSON array of strings.`;
  const user = `Action items:\n\n${text.slice(0, 2000)}`; // Reduced text
  const raw = await callGroq(system, user, 200); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return raw
      .split('\n')
      .map((l) => l.replace(/^[-•*\d.]\s*/, '').trim())
      .filter((l) => l.length > 5)
      .slice(0, 5);
  }
}

// ── 5. SENTIMENT ───────────────────────────────────────
export async function getSentiment(text) {
  const system = `Return ONLY JSON: {"label":"Positive|Neutral|Negative","score":0-100}`;
  const user = `Sentiment:\n\n${text.slice(0, 1500)}`; // Reduced text
  const raw = await callGroq(system, user, 100); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { label: 'Neutral', score: 50, explanation: 'Could not determine sentiment.' };
  }
}

// ── 6. Q&A ─────────────────────────────────────────────
export async function askQuestion(text, question) {
  const system = `Answer in under 50 words.`;
  const user = `Doc:\n${text.slice(0, 2000)}\n\nQ: ${question}`; // Reduced text
  return callGroq(system, user, 150); // Reduced tokens
}

// ── 7. DOCUMENT TYPE DETECTION ─────────────────────────
export async function getDocumentType(text) {
  const system = `Return ONLY JSON: {"type":"Contract|Report|Email|Letter|Invoice|Resume|Article|Research Paper|Meeting Notes|Legal Document|Financial Document|Other","confidence":0-100}`;
  const user = `Document type?\n\n${text.slice(0, 1000)}`; // Reduced text
  const raw = await callGroq(system, user, 100); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { type: 'Other', confidence: 50, description: 'Could not determine document type.' };
  }
}

// ── 8. LANGUAGE DETECTION ──────────────────────────────
export async function getLanguage(text) {
  const system = `Return ONLY JSON: {"language":"English|Spanish|French|German|etc","code":"en|es|fr|de|etc"}`;
  const user = `Language?\n\n${text.slice(0, 500)}`; // Reduced text
  const raw = await callGroq(system, user, 80); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { language: 'English', code: 'en', confidence: 80 };
  }
}

// ── 9. KEY ENTITIES EXTRACTION ─────────────────────────
export async function getEntities(text) {
  const system = `Extract up to 5 entities. Return ONLY JSON array with "name", "type", "context" keys.`;
  const user = `Entities:\n\n${text.slice(0, 2000)}`; // Reduced text
  const raw = await callGroq(system, user, 300); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── 10. KEYWORD EXTRACTION ─────────────────────────────
export async function getKeywords(text) {
  const system = `Extract 5-8 keywords. Return ONLY JSON array of strings.`;
  const user = `Keywords:\n\n${text.slice(0, 2000)}`; // Reduced text
  const raw = await callGroq(system, user, 200); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return raw.split('\n').map(l => l.replace(/^[-•*\d.]\s*/, '').trim()).filter(l => l.length > 2).slice(0, 10);
  }
}

// ── 11. READING LEVEL ANALYSIS ─────────────────────────
export async function getReadingLevel(text) {
  const system = `Return ONLY JSON: {"level":"Elementary|Middle School|High School|College|Graduate|Expert","score":0-100}`;
  const user = `Reading level?\n\n${text.slice(0, 1500)}`; // Reduced text
  const raw = await callGroq(system, user, 150); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { level: 'College', score: 60, description: 'Standard professional content.', avgSentenceLength: 15, complexWordPercentage: 15 };
  }
}

// ── 12. TOPIC MODELING ─────────────────────────────────
export async function getTopics(text) {
  const system = `Identify 2-3 main topics. Return ONLY JSON array with "topic" and "relevance" keys.`;
  const user = `Topics:\n\n${text.slice(0, 2000)}`; // Reduced text
  const raw = await callGroq(system, user, 300); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── 13. DOCUMENT COMPARISON ────────────────────────────
export async function compareDocuments(text1, text2) {
  const system = `Compare documents. Return ONLY JSON: {"similarities":[],"differences":[],"overallSimilarity":0-100}`;
  const user = `Doc1:\n${text1.slice(0, 1500)}\n\nDoc2:\n${text2.slice(0, 1500)}\n\nCompare:`; // Reduced text
  const raw = await callGroq(system, user, 400); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { similarities: [], differences: [], overallSimilarity: 50, recommendation: 'Could not compare documents.' };
  }
}

// ── 14. COMPLIANCE CHECK ───────────────────────────────
export async function checkCompliance(text, docType) {
  const system = `Check compliance. Return ONLY JSON array with "category", "status" keys.`;
  const user = `Type: ${docType}\n\nCheck:\n\n${text.slice(0, 2000)}`; // Reduced text
  const raw = await callGroq(system, user, 300); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── 15. DOCUMENT TEMPLATES ─────────────────────────────
export const DOCUMENT_TEMPLATES = {
  contract: {
    name: 'Contract Analysis',
    description: 'Detailed contract review with legal focus',
    analyses: ['summary', 'keyPoints', 'riskFlags', 'actionItems', 'compliance', 'entities'],
    prompt: 'Focus on legal terms, obligations, liabilities, termination clauses, and renewal terms.'
  },
  resume: {
    name: 'Resume Screening',
    description: 'Extract candidate qualifications and experience',
    analyses: ['summary', 'keyPoints', 'entities', 'keywords'],
    prompt: 'Focus on skills, experience, education, certifications, and achievements.'
  },
  report: {
    name: 'Report Analysis',
    description: 'Comprehensive report breakdown',
    analyses: ['summary', 'keyPoints', 'topics', 'readingLevel', 'sentiment'],
    prompt: 'Focus on findings, conclusions, recommendations, and data insights.'
  },
  meeting_notes: {
    name: 'Meeting Notes',
    description: 'Extract decisions and action items',
    analyses: ['summary', 'actionItems', 'keyPoints', 'entities'],
    prompt: 'Focus on decisions made, action items assigned, deadlines, and responsible parties.'
  },
  research_paper: {
    name: 'Research Paper',
    description: 'Academic paper analysis',
    analyses: ['summary', 'keyPoints', 'topics', 'readingLevel', 'keywords'],
    prompt: 'Focus on hypothesis, methodology, findings, contributions, and limitations.'
  }
};

// ── 16. BATCH ANALYSIS ─────────────────────────────────
export async function batchAnalyze(documents, template = 'general') {
  const results = [];
  
  for (const doc of documents) {
    try {
      const analysis = {
        fileName: doc.name,
        summary: await getSummary(doc.text),
        keyPoints: await getKeyPoints(doc.text),
        riskFlags: await getRiskFlags(doc.text),
        actionItems: await getActionItems(doc.text),
        sentiment: await getSentiment(doc.text),
        docType: await getDocumentType(doc.text),
        language: await getLanguage(doc.text),
      };
      
      if (template !== 'general') {
        const tmpl = DOCUMENT_TEMPLATES[template];
        if (tmpl.analyses.includes('topics')) {
          analysis.topics = await getTopics(doc.text);
        }
        if (tmpl.analyses.includes('keywords')) {
          analysis.keywords = await getKeywords(doc.text);
        }
        if (tmpl.analyses.includes('readingLevel')) {
          analysis.readingLevel = await getReadingLevel(doc.text);
        }
        if (tmpl.analyses.includes('compliance') && analysis.docType) {
          analysis.compliance = await checkCompliance(doc.text, analysis.docType.type);
        }
        if (tmpl.analyses.includes('entities')) {
          analysis.entities = await getEntities(doc.text);
        }
      }
      
      results.push(analysis);
    } catch (error) {
      results.push({
        fileName: doc.name,
        error: error.message
      });
    }
  }
  
  return results;
}

// ── 17. FIND RELATED DOCUMENTS ─────────────────────────
export async function findRelatedDocuments(currentText, documentHistory) {
  const currentKeywords = await getKeywords(currentText);
  const currentTopics = await getTopics(currentText);
  
  const related = documentHistory.map(doc => {
    let similarityScore = 0;
    
    // Keyword matching
    if (doc.keywords) {
      const matchingKeywords = currentKeywords.filter(kw => 
        doc.keywords.some(dkw => dkw.toLowerCase().includes(kw.toLowerCase()))
      );
      similarityScore += (matchingKeywords.length / Math.max(currentKeywords.length, 1)) * 40;
    }
    
    // Topic matching
    if (doc.topics) {
      const matchingTopics = currentTopics.filter(topic => 
        doc.topics.some(dtopic => dtopic.topic.toLowerCase().includes(topic.topic.toLowerCase()))
      );
      similarityScore += (matchingTopics.length / Math.max(currentTopics.length, 1)) * 60;
    }
    
    return {
      ...doc,
      similarityScore: Math.round(similarityScore),
      matchingKeywords: currentKeywords.filter(kw => 
        doc.keywords?.some(dkw => dkw.toLowerCase().includes(kw.toLowerCase()))
      ),
    };
  })
  .filter(doc => doc.similarityScore > 20)
  .sort((a, b) => b.similarityScore - a.similarityScore)
  .slice(0, 5);
  
  return related;
}

// ── 18. GENERATE EMAIL CONTENT ─────────────────────────
export async function generateEmailContent(analysis, recipientType = 'manager') {
  const system = `Generate a professional email summarizing the document analysis. 
    For ${recipientType}: focus on ${recipientType === 'manager' ? 'key insights and business impact' : 'detailed findings and recommendations'}.
    Return ONLY JSON: {"subject": "email subject", "body": "email body in HTML"}`;
  
  const user = `Document: ${analysis.fileName}
Summary: ${analysis.summary}
Key Points: ${analysis.keyPoints?.join(', ')}
Risks: ${analysis.riskFlags?.map(r => r.risk).join(', ')}
Action Items: ${analysis.actionItems?.join(', ')}
Sentiment: ${analysis.sentiment?.label} (${analysis.sentiment?.score}/100)`;

  const raw = await callGroq(system, user, 500);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      subject: `Document Analysis: ${analysis.fileName}`,
      body: `<p>Summary: ${analysis.summary}</p>`
    };
  }
}

// ── 19. SMART HIGHLIGHTS EXTRACTION ────────────────────
export async function extractHighlights(text) {
  const system = `Extract highlights. Return ONLY JSON: {"risks":[{"text":"","explanation":""}],"actions":[{"text":"","explanation":""}],"dates":[{"text":"","date":"","context":"","severity":""}],"entities":[{"text":"","type":"","role":""}]}. Keep text under 30 chars each.`;
  
  const user = `Highlights:\n\n${text.slice(0, 2500)}`; // Reduced text
  const raw = await callGroq(system, user, 500); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    console.log('Highlights raw response:', raw);
    console.log('Highlights cleaned response:', cleaned);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Highlights parsing error:', error);
    console.error('Highlights raw response:', raw);
    return { risks: [], actions: [], dates: [], entities: [] };
  }
}

// ── 20. DEADLINE & CALENDAR EXTRACTION ─────────────────
export async function extractDeadlines(text) {
  const system = `Extract deadlines. Return ONLY JSON array: [{"date":"YYYY-MM-DD","title":"","description":"","severity":"high/medium/low","daysUntil":0}]`;
  
  const user = `Deadlines:\n\n${text.slice(0, 2500)}`; // Reduced text
  const raw = await callGroq(system, user, 400); // Reduced tokens
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    console.log('Deadlines raw response:', raw);
    console.log('Deadlines cleaned response:', cleaned);
    const deadlines = JSON.parse(cleaned);
    
    // Add current date info
    const now = new Date();
    return deadlines.map(d => ({
      ...d,
      extractedAt: now.toISOString(),
    }));
  } catch (error) {
    console.error('Deadlines parsing error:', error);
    console.error('Deadlines raw response:', raw);
    return [];
  }
}

// ── 21. GENERATE CALENDAR EVENT (ICS FORMAT) ──────────
export function generateCalendarEvent(deadline, documentName) {
  const now = new Date();
  const eventDate = new Date(deadline.date);
  const eventDateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const nowStr = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Default reminder: 1 day before for high severity, 1 week for medium, 2 weeks for low
  const reminderDays = deadline.severity === 'high' ? 1 : deadline.severity === 'medium' ? 7 : 14;
  const reminderDate = new Date(eventDate);
  reminderDate.setDate(reminderDate.getDate() - reminderDays);
  const reminderStr = reminderDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DocuMind AI//Document Analysis//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${now.getTime()}@documind-ai
DTSTAMP:${nowStr}
DTSTART;VALUE=DATE:${eventDateStr}
DTEND;VALUE=DATE:${eventDateStr}
SUMMARY:${deadline.title}
DESCRIPTION:${deadline.description}\\n\\nSource: ${documentName}\\nPriority: ${deadline.severity}\\nExtracted by DocuMind AI
LOCATION:TBD
STATUS:NEEDS-ACTION
PRIORITY:${deadline.severity === 'high' ? 1 : deadline.severity === 'medium' ? 5 : 9}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder: ${deadline.title}
TRIGGER;RELATED=START:-P${reminderDays}D
END:VALARM
END:VEVENT
END:VCALENDAR`;
  
  return icsContent;
}

// ── 22. GEMINI FALLBACK INTEGRATION ────────────────────
let useGeminiFallback = false;

export function setGeminiFallback(enabled) {
  useGeminiFallback = enabled;
}

export function isGeminiFallback() {
  return useGeminiFallback;
}

// Import Gemini functions dynamically when needed
async function getGeminiFunctions() {
  try {
    const gemini = await import('./geminiService.js');
    return gemini;
  } catch {
    return null;
  }
}

// ── 23. ANALYSIS STATISTICS ────────────────────────────
export function calculateAnalysisStats(analyses) {
  if (!analyses || analyses.length === 0) {
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

  const stats = {
    totalDocuments: analyses.length,
    avgWords: Math.round(analyses.reduce((sum, a) => sum + (a.stats?.words || 0), 0) / analyses.length),
    avgReadingTime: Math.round(analyses.reduce((sum, a) => sum + (a.stats?.readingMinutes || 0), 0) / analyses.length),
    sentimentDistribution: {},
    docTypeDistribution: {},
    languageDistribution: {},
    riskTrends: { high: 0, medium: 0, low: 0 },
    topKeywords: [],
  };

  // Sentiment distribution
  analyses.forEach(a => {
    if (a.sentiment?.label) {
      stats.sentimentDistribution[a.sentiment.label] = (stats.sentimentDistribution[a.sentiment.label] || 0) + 1;
    }
  });

  // Document type distribution
  analyses.forEach(a => {
    if (a.docType?.type) {
      stats.docTypeDistribution[a.docType.type] = (stats.docTypeDistribution[a.docType.type] || 0) + 1;
    }
  });

  // Language distribution
  analyses.forEach(a => {
    if (a.language?.language) {
      stats.languageDistribution[a.language.language] = (stats.languageDistribution[a.language.language] || 0) + 1;
    }
  });

  // Risk trends
  analyses.forEach(a => {
    if (a.riskFlags) {
      a.riskFlags.forEach(r => {
        if (r.severity) {
          stats.riskTrends[r.severity] = (stats.riskTrends[r.severity] || 0) + 1;
        }
      });
    }
  });

  // Top keywords
  const keywordCounts = {};
  analyses.forEach(a => {
    if (a.keywords) {
      a.keywords.forEach(kw => {
        keywordCounts[kw.toLowerCase()] = (keywordCounts[kw.toLowerCase()] || 0) + 1;
      });
    }
  });
  stats.topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  return stats;
}
