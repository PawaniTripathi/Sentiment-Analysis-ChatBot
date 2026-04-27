/**
 * API Service
 * Handles all HTTP communication with the backend
 * The backend is the ONLY point that communicates with OpenRouter
 */

import axios from 'axios';

// Base URL for the backend API
// In production (Vercel), VITE_API_URL must be set to the Render backend URL
// e.g. https://your-backend.onrender.com
// In local development the Vite proxy rewrites /api → http://localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// Create a configured axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 35000, // 35 seconds (backend has 30s timeout + buffer)
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle cases where the backend is down or proxy fails (returns HTML or network error)
    if (error.message === 'Network Error' || (error.response && error.response.status === 500 && typeof error.response.data === 'string' && error.response.data.includes('<html'))) {
      return Promise.reject(new Error("The backend server is currently not running or unreachable. Please ensure the backend is started."));
    }

    // Extract a clean error message from the backend
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * Analyzes text for sentiment, emotions, and keywords
 * @param {string} text - The text to analyze
 * @param {Array} conversationHistory - Previous chat messages for context
 * @returns {Object} Analysis result data
 */
export const analyzeText = async (text, conversationHistory = []) => {
  const response = await apiClient.post('/analysis/analyze', {
    text,
    conversationHistory: conversationHistory.slice(-6), // Send last 6 messages
  });
  return response.data;
};

/**
 * Sends a conversational message to the chatbot
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous chat messages for context
 * @param {Object|null} lastAnalysis - The most recent analysis result
 * @returns {Object} Chat response data
 */
export const sendChatMessage = async (message, conversationHistory = [], lastAnalysis = null) => {
  const response = await apiClient.post('/chat/message', {
    message,
    conversationHistory: conversationHistory.slice(-10),
    lastAnalysis,
  });
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
