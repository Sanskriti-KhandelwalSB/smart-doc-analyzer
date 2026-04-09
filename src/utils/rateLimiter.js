// ─────────────────────────────────────────────────────────
//  rateLimiter.js  —  Shared Rate Limit & Retry Logic
//  Prevents "Rate Limit Exceeded" errors across all APIs
// ─────────────────────────────────────────────────────────

// ── Configuration ────────────────────────────────────────
const CONFIG = {
  // Groq free tier: 30 requests/minute, 200 requests/day
  groq: {
    maxRetries: 3,
    baseDelay: 3000,      // Start with 3 second delay
    maxDelay: 30000,      // Cap at 30 seconds
    requestsPerMinute: 30,
    minInterval: 2500,    // Minimum 2.5 seconds between requests
  },
  // Gemini free tier: 15 requests/minute
  gemini: {
    maxRetries: 3,
    baseDelay: 5000,      // Start with 5 second delay (Gemini needs more)
    maxDelay: 30000,
    requestsPerMinute: 15,
    minInterval: 5000,    // Minimum 5 seconds between requests
  },
};

// ── Global Rate Limit State ──────────────────────────────
let lastRateLimitError = null;
let rateLimitResetTime = 0;
let allApisRateLimited = false;

// Check if we should skip API calls due to recent rate limits
export function shouldSkipDueToRateLimit() {
  if (!allApisRateLimited) return false;
  if (Date.now() < rateLimitResetTime) {
    return true;
  }
  // Reset after cooldown period
  allApisRateLimited = false;
  return false;
}

// Get time until rate limits might reset
export function getRateLimitResetTime() {
  if (!allApisRateLimited) return 0;
  return Math.max(0, rateLimitResetTime - Date.now());
}

// Mark all APIs as rate limited
export function markAllApisRateLimited(resetInMs = 60000) {
  allApisRateLimited = true;
  rateLimitResetTime = Date.now() + resetInMs;
  console.warn(`⚠️ All APIs rate limited. Cooldown for ${resetInMs/1000}s`);
}

// Reset rate limit state
export function resetRateLimitState() {
  allApisRateLimited = false;
  lastRateLimitError = null;
  rateLimitResetTime = 0;
}

// ── Request Queue for Rate Limiting ──────────────────────
class RequestQueue {
  constructor(minInterval) {
    this.minInterval = minInterval;
    this.lastRequestTime = 0;
    this.queue = [];
    this.processing = false;
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      const { task, resolve, reject } = this.queue.shift();
      this.lastRequestTime = Date.now();
      
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this.processing = false;
  }
}

// Create queues for each API
const groqQueue = new RequestQueue(CONFIG.groq.minInterval);
const geminiQueue = new RequestQueue(CONFIG.gemini.minInterval);

// ── Exponential Backoff with Jitter ──────────────────────
function calculateBackoff(attempt, baseDelay, maxDelay) {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter (random 0-1000ms) to prevent thundering herd
  const jitter = Math.random() * 1000;
  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

// ── Parse Rate Limit Error ──────────────────────────────
function parseRateLimitError(error) {
  const errorMsg = error.message || '';
  
  // Groq rate limit messages
  const groqMatch = errorMsg.match(/try again in ([\d.]+)s/i);
  if (groqMatch) {
    return {
      isRateLimit: true,
      suggestedWait: parseFloat(groqMatch[1]) * 1000,
      provider: 'groq'
    };
  }
  
  // Gemini rate limit messages
  if (errorMsg.includes('RESOURCE_EXHAUSTED') || 
      errorMsg.includes('quota') || 
      errorMsg.includes('rate limit')) {
    return {
      isRateLimit: true,
      suggestedWait: 5000, // Default 5 second wait
      provider: 'gemini'
    };
  }
  
  // HTTP 429 - Too Many Requests
  if (error.status === 429) {
    return {
      isRateLimit: true,
      suggestedWait: 5000,
      provider: 'unknown'
    };
  }
  
  return { isRateLimit: false };
}

// ── Retry with Exponential Backoff ──────────────────────
export async function retryWithBackoff(
  apiFunction,
  provider = 'groq',
  options = {}
) {
  const config = CONFIG[provider] || CONFIG.groq;
  const {
    maxRetries = config.maxRetries,
    baseDelay = config.baseDelay,
    maxDelay = config.maxDelay,
    fallbackFunction = null,
  } = options;

  let lastError = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Use the appropriate queue to enforce rate limiting
      const queue = provider === 'gemini' ? geminiQueue : groqQueue;
      
      const result = await queue.add(async () => {
        return await apiFunction();
      });
      
      return result;
      
    } catch (error) {
      lastError = error;
      const rateLimitInfo = parseRateLimitError(error);

      if (rateLimitInfo.isRateLimit) {
        console.log(`Rate limit hit for ${provider} (attempt ${attempt + 1}/${maxRetries + 1})`);

        // If we have a fallback function and this is the last retry, use it
        if (fallbackFunction && attempt === maxRetries) {
          try {
            console.log(`Attempting fallback (${typeof fallbackFunction.name === 'string' ? fallbackFunction.name : 'fallback'})...`);
            const fallbackResult = await fallbackFunction();
            console.log('✅ Fallback successful!');
            return fallbackResult;
          } catch (fallbackError) {
            console.error('Fallback failed:', fallbackError.message);
            throw new Error(`Rate limit exceeded. Fallback also failed: ${fallbackError.message}`);
          }
        }

        // Calculate wait time
        const waitTime = rateLimitInfo.suggestedWait || calculateBackoff(attempt, baseDelay, maxDelay);
        
        if (attempt < maxRetries) {
          console.log(`Waiting ${Math.round(waitTime / 1000)}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        attempt++;
      } else {
        // Not a rate limit error, throw immediately
        throw error;
      }
    }
  }

  // All retries exhausted
  throw new Error(`Max retries (${maxRetries}) exceeded for ${provider}. Last error: ${lastError?.message || 'Unknown error'}`);
}

// ── Simple Delay Function ───────────────────────────────
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Check if Error is Rate Limit Related ────────────────
export function isRateLimitError(error) {
  return parseRateLimitError(error).isRateLimit;
}

// ── Get Queue Status (for debugging) ────────────────────
export function getQueueStatus() {
  return {
    groq: {
      queueLength: groqQueue.queue.length,
      processing: groqQueue.processing,
      lastRequest: groqQueue.lastRequestTime,
    },
    gemini: {
      queueLength: geminiQueue.queue.length,
      processing: geminiQueue.processing,
      lastRequest: geminiQueue.lastRequestTime,
    },
  };
}

// ── Clear Queues (for testing) ──────────────────────────
export function clearQueues() {
  groqQueue.queue = [];
  geminiQueue.queue = [];
  groqQueue.processing = false;
  geminiQueue.processing = false;
}