/**
 * API Service
 * Handles all HTTP communication with the backend
 * The backend is the ONLY point that communicates with AI providers.
 *
 * Timeout is set high (90s) to handle:
 *  - Render free-tier cold starts (can take 30-60s)
 *  - Gemini → OpenRouter fallback chain (up to 60s combined)
 */

import axios from 'axios';

// Base URL for the backend API
// In production (Vercel), VITE_API_URL must be set to the Render backend URL
// e.g. https://your-backend.onrender.com
// In local development the Vite proxy rewrites /api → http://localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

// Create a configured axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 90s: covers Render cold-start (≤60s) + Gemini+OpenRouter fallback chain (≤60s)
  timeout: 90000,
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle cases where the backend is down or proxy fails (returns HTML or network error)
    if (
      error.message === 'Network Error' ||
      (error.response &&
        error.response.status === 500 &&
        typeof error.response.data === 'string' &&
        error.response.data.includes('<html'))
    ) {
      return Promise.reject(
        new Error(
          'The backend server is waking up (Render cold start). Please wait ~30 seconds and try again.'
        )
      );
    }

    // Timeout → friendly message
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(
        new Error(
          'The request timed out. The server may be waking up — please try again in a moment.'
        )
      );
    }

    // Extract a clean error message from the backend
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─── Retry Helper ─────────────────────────────────────────────────────────────
/**
 * Retries an async function up to `maxRetries` times with exponential back-off.
 * Only retries on network errors or 5xx/429 status codes (transient failures).
 */
const withRetry = async (fn, maxRetries = 2, delayMs = 3000) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const isTransient =
        !status ||               // network error / cold start
        status === 429 ||        // rate limited
        status >= 500;           // server error

      if (attempt < maxRetries && isTransient) {
        const wait = delayMs * Math.pow(2, attempt); // 3s, 6s …
        console.warn(`⚠️ Attempt ${attempt + 1} failed (${err.message}). Retrying in ${wait / 1000}s…`);
        await new Promise((res) => setTimeout(res, wait));
      } else {
        break;
      }
    }
  }
  throw lastError;
};

/**
 * Analyzes text for sentiment, emotions, and keywords.
 * Auto-retries up to 2 times on transient failures (cold starts, rate limits).
 *
 * @param {string} text - The text to analyze
 * @param {Array}  conversationHistory - Previous chat messages for context
 * @returns {Object} Analysis result data
 */
export const analyzeText = async (text, conversationHistory = []) => {
  const response = await withRetry(() =>
    apiClient.post('/analysis/analyze', {
      text,
      conversationHistory: conversationHistory.slice(-6),
    })
  );
  return response.data;
};

/**
 * Sends a conversational message to the chatbot.
 * Auto-retries up to 1 time on transient failures.
 *
 * @param {string}      message             - The user's message
 * @param {Array}       conversationHistory - Previous chat messages for context
 * @param {Object|null} lastAnalysis        - The most recent analysis result
 * @returns {Object} Chat response data
 */
export const sendChatMessage = async (message, conversationHistory = [], lastAnalysis = null) => {
  const response = await withRetry(
    () =>
      apiClient.post('/chat/message', {
        message,
        conversationHistory: conversationHistory.slice(-10),
        lastAnalysis,
      }),
    1 // only 1 retry for chat (faster UX)
  );
  return response.data;
};

/**
 * Checks backend health status
 * @returns {Object} Health status
 */
export const checkHealth = async () => {
  const response = await apiClient.get('/health'.replace('/api', ''));
  return response.data;
};

