// ─────────────────────────────────────────────────────────
//  geminiService.js  —  Fallback AI via Google Gemini
//  Used when Groq rate limits are exceeded
//  Includes rate limit handling with exponential backoff
// ─────────────────────────────────────────────────────────

import { retryWithBackoff } from './rateLimiter';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const getGeminiKey = () => process.env.REACT_APP_GEMINI_API_KEY || '';

// ── Call Gemini API with Rate Limit Handling ─────────────
async function fetchGemini(prompt, maxTokens = 512) {
  const key = getGeminiKey();
  if (!key || key === 'your_gemini_api_key_here') {
    throw new Error('NO_GEMINI_KEY');
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${key}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.4,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error?.message || `Gemini API Error ${res.status}`);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── Public callGemini with retry logic ──────────────────
export async function callGemini(prompt, maxTokens = 512) {
  return retryWithBackoff(
    () => fetchGemini(prompt, maxTokens),
    'gemini'
  );
}

// ── 1. SUMMARY ─────────────────────────────────────────
export async function getSummaryGemini(text) {
  const prompt = `Summarize in 2-3 sentences max:\n\n${text.slice(0, 2000)}`;
  const raw = await callGemini(prompt, 200);
  return raw.trim();
}

// ── 2. KEY POINTS ──────────────────────────────────────
export async function getKeyPointsGemini(text) {
  const prompt = `Extract 3 key points max. Return ONLY JSON array of strings:\n\n${text.slice(0, 2000)}`;
  const raw = await callGemini(prompt, 200);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return raw.split('\n').map(l => l.replace(/^[-•*\d.]\s*/, '').trim()).filter(l => l.length > 10).slice(0, 3);
  }
}

// ── 3. RISK FLAGS ──────────────────────────────────────
export async function getRiskFlagsGemini(text) {
  const prompt = `Identify up to 2 key risks. Return ONLY JSON array with "risk" and "severity" keys:\n\n${text.slice(0, 2000)}`;
  const raw = await callGemini(prompt, 200);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── 4. ACTION ITEMS ────────────────────────────────────
export async function getActionItemsGemini(text) {
  const prompt = `Extract up to 3 action items. Return ONLY JSON array of strings:\n\n${text.slice(0, 2000)}`;
  const raw = await callGemini(prompt, 200);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return raw.split('\n').map(l => l.replace(/^[-•*\d.]\s*/, '').trim()).filter(l => l.length > 5).slice(0, 3);
  }
}

// ── 5. SENTIMENT ───────────────────────────────────────
export async function getSentimentGemini(text) {
  const prompt = `Return ONLY JSON: {"label":"Positive|Neutral|Negative","score":0-100}:\n\n${text.slice(0, 1500)}`;
  const raw = await callGemini(prompt, 100);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { label: 'Neutral', score: 50 };
  }
}

// ── 6. DOCUMENT TYPE ───────────────────────────────────
export async function getDocumentTypeGemini(text) {
  const prompt = `Return ONLY JSON: {"type":"Contract|Report|Email|Letter|Invoice|Resume|Article|Research Paper|Meeting Notes|Legal Document|Financial Document|Other","confidence":0-100}:\n\n${text.slice(0, 1000)}`;
  const raw = await callGemini(prompt, 100);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { type: 'Other', confidence: 50 };
  }
}

// ── 7. LANGUAGE ────────────────────────────────────────
export async function getLanguageGemini(text) {
  const prompt = `Return ONLY JSON: {"language":"English|Spanish|French|German|etc","code":"en|es|fr|de|etc"}:\n\n${text.slice(0, 500)}`;
  const raw = await callGemini(prompt, 80);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { language: 'English', code: 'en' };
  }
}

// ── 8. KEYWORDS ────────────────────────────────────────
export async function getKeywordsGemini(text) {
  const prompt = `Extract 5-8 keywords. Return ONLY JSON array of strings:\n\n${text.slice(0, 2000)}`;
  const raw = await callGemini(prompt, 200);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return raw.split('\n').map(l => l.replace(/^[-•*\d.]\s*/, '').trim()).filter(l => l.length > 2).slice(0, 8);
  }
}

// ── 9. READING LEVEL ───────────────────────────────────
export async function getReadingLevelGemini(text) {
  const prompt = `Return ONLY JSON: {"level":"Elementary|Middle School|High School|College|Graduate|Expert","score":0-100}:\n\n${text.slice(0, 1500)}`;
  const raw = await callGemini(prompt, 150);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { level: 'College', score: 60 };
  }
}

// ── 10. TOPICS ─────────────────────────────────────────
export async function getTopicsGemini(text) {
  const prompt = `Identify 2-3 main topics. Return ONLY JSON array with "topic" and "relevance" keys:\n\n${text.slice(0, 2000)}`;
  const raw = await callGemini(prompt, 300);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── 11. COMPLIANCE ─────────────────────────────────────
export async function checkComplianceGemini(text, docType) {
  const prompt = `Check compliance. Return ONLY JSON array with "category", "status" keys:\nType: ${docType}\n\n${text.slice(0, 2000)}`;
  const raw = await callGemini(prompt, 300);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── 12. HIGHLIGHTS ─────────────────────────────────────
export async function extractHighlightsGemini(text) {
  const prompt = `Extract highlights. Return ONLY JSON: {"risks":[{"text":"","explanation":""}],"actions":[{"text":"","explanation":""}],"dates":[{"text":"","date":"","context":"","severity":""}],"entities":[{"text":"","type":"","role":""}]}. Keep text under 30 chars each:\n\n${text.slice(0, 2500)}`;
  const raw = await callGemini(prompt, 500);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { risks: [], actions: [], dates: [], entities: [] };
  }
}

// ── 13. DEADLINES ──────────────────────────────────────
export async function extractDeadlinesGemini(text) {
  const prompt = `Extract deadlines. Return ONLY JSON array: [{"date":"YYYY-MM-DD","title":"","description":"","severity":"high/medium/low","daysUntil":0}]:\n\n${text.slice(0, 2500)}`;
  const raw = await callGemini(prompt, 400);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── BATCH ANALYSIS WITH GEMINI ─────────────────────────
export async function analyzeWithGemini(text, mode = 'basic') {
  const results = {};
  
  try {
    // Core analysis (always run)
    results.summary = await getSummaryGemini(text);
    results.keyPoints = await getKeyPointsGemini(text);
    results.risks = await getRiskFlagsGemini(text);
    results.actionItems = await getActionItemsGemini(text);
    results.sentiment = await getSentimentGemini(text);
    results.docType = await getDocumentTypeGemini(text);
    results.language = await getLanguageGemini(text);
    
    if (mode === 'basic' || mode === 'advanced') {
      results.keywords = await getKeywordsGemini(text);
    }
    
    if (mode === 'advanced') {
      results.readingLevel = await getReadingLevelGemini(text);
      results.topics = await getTopicsGemini(text);
      results.highlights = await extractHighlightsGemini(text);
      results.deadlines = await extractDeadlinesGemini(text);
      if (results.docType) {
        results.compliance = await checkComplianceGemini(text, results.docType.type);
      }
    }
    
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}