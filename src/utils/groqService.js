// ─────────────────────────────────────────────────────────
//  groqService.js  —  FREE AI via Groq (llama-3.3-70b-versatile)
//  Get your free key at: https://console.groq.com
// ─────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // Free model — more powerful, different rate limits

const getKey = () => process.env.REACT_APP_GROQ_API_KEY || '';

// ── Rate Limit Handler with Exponential Backoff ─────────
async function callGroq(systemPrompt, userPrompt, maxTokens = 1024, retries = 3) {
  const key = getKey();
  if (!key || key === 'your_groq_api_key_here') {
    throw new Error('NO_KEY');
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
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
        
        // Check if it's a rate limit error
        if (errorMsg.includes('Rate limit reached') && attempt < retries - 1) {
          // Extract wait time from error message if available
          const waitMatch = errorMsg.match(/try again in ([\d.]+)s/);
          const waitTime = waitMatch ? parseFloat(waitMatch[1]) * 1000 : (2000 * Math.pow(2, attempt));
          
          console.log(`Rate limit hit. Waiting ${waitTime/1000}s before retry ${attempt + 1}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Retry
        }
        
        throw new Error(errorMsg);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
      
    } catch (error) {
      // If it's the last attempt or not a rate limit error, throw
      if (attempt === retries - 1 || !error.message.includes('Rate limit')) {
        throw error;
      }
      // Otherwise wait and retry
      const waitTime = 2000 * Math.pow(2, attempt);
      console.log(`Error occurred. Retrying in ${waitTime/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// ── 1. SUMMARY ─────────────────────────────────────────
export async function getSummary(text) {
  const system = `You are a professional document analyst. Provide a concise summary in 3-4 sentences.`;
  const user = `Summarize:\n\n${text.slice(0, 4000)}`; // Reduced from 6000
  return callGroq(system, user, 300); // Reduced from 512
}

// ── 2. KEY POINTS ──────────────────────────────────────
export async function getKeyPoints(text) {
  const system = `Extract exactly 5 key points. Return ONLY a JSON array of strings.`;
  const user = `Key points:\n\n${text.slice(0, 4000)}`; // Reduced from 6000
  const raw = await callGroq(system, user, 300); // Reduced from 512
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
  const system = `Identify up to 3 key risks. Return ONLY a JSON array with "risk" and "severity" keys.`;
  const user = `Risks:\n\n${text.slice(0, 4000)}`; // Reduced from 6000
  const raw = await callGroq(system, user, 300); // Reduced from 512
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── 4. ACTION ITEMS ────────────────────────────────────
export async function getActionItems(text) {
  const system = `Extract up to 5 action items. Return ONLY a JSON array of strings.`;
  const user = `Action items:\n\n${text.slice(0, 4000)}`; // Reduced from 6000
  const raw = await callGroq(system, user, 300); // Reduced from 512
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
  const system = `Analyze sentiment. Return ONLY JSON: {"label":"Positive|Neutral|Negative","score":0-100,"explanation":"one sentence"}`;
  const user = `Sentiment:\n\n${text.slice(0, 3000)}`; // Reduced from 4000
  const raw = await callGroq(system, user, 150); // Reduced from 256
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { label: 'Neutral', score: 50, explanation: 'Could not determine sentiment.' };
  }
}

// ── 6. Q&A ─────────────────────────────────────────────
export async function askQuestion(text, question) {
  const system = `Answer concisely in under 100 words.`;
  const user = `Doc:\n${text.slice(0, 4000)}\n\nQ: ${question}`; // Reduced from 6000
  return callGroq(system, user, 200); // Reduced from 300
}

// ── 7. DOCUMENT TYPE DETECTION ─────────────────────────
export async function getDocumentType(text) {
  const system = `Identify the document type. Return ONLY JSON: {"type":"Contract|Report|Email|Letter|Invoice|Resume|Article|Research Paper|Meeting Notes|Legal Document|Financial Document|Other","confidence":0-100,"description":"brief explanation"}`;
  const user = `What type of document is this?\n\n${text.slice(0, 2000)}`;
  const raw = await callGroq(system, user, 150);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { type: 'Other', confidence: 50, description: 'Could not determine document type.' };
  }
}

// ── 8. LANGUAGE DETECTION ──────────────────────────────
export async function getLanguage(text) {
  const system = `Detect the language. Return ONLY JSON: {"language":"English|Spanish|French|German|etc","code":"en|es|fr|de|etc","confidence":0-100}`;
  const user = `What language is this text written in?\n\n${text.slice(0, 1000)}`;
  const raw = await callGroq(system, user, 100);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { language: 'English', code: 'en', confidence: 80 };
  }
}

// ── 9. KEY ENTITIES EXTRACTION ─────────────────────────
export async function getEntities(text) {
  const system = `Extract key entities. Return ONLY JSON array of objects with "name", "type" (person/organization/date/money/location), and "context" keys. Max 8 entities.`;
  const user = `Extract important entities (people, organizations, dates, amounts, locations):\n\n${text.slice(0, 3000)}`;
  const raw = await callGroq(system, user, 400);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
