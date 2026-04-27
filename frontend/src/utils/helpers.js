/**
 * Utility Functions for the AI Sentiment Intelligence System
 */

/**
 * Formats a sentiment string with proper casing
 * @param {string} sentiment - Raw sentiment value
 * @returns {string} Formatted sentiment
 */
export const formatSentiment = (sentiment) => {
  if (!sentiment) return 'Neutral';
  return sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
};

/**
 * Returns the CSS class name for a given sentiment
 * @param {string} sentiment - Sentiment value (Positive/Negative/Neutral)
 * @returns {string} CSS class suffix
 */
export const getSentimentClass = (sentiment) => {
  const map = {
    positive: 'positive',
    negative: 'negative',
    neutral: 'neutral',
  };
  return map[sentiment?.toLowerCase()] || 'neutral';
};

/**
 * Returns an emoji for a given sentiment
 * @param {string} sentiment
 * @returns {string} Emoji character
 */
export const getSentimentEmoji = (sentiment) => {
  const map = {
    Positive: '😊',
    Negative: '😔',
    Neutral: '😐',
  };
  return map[sentiment] || '🤔';
};

/**
 * Returns an emoji for a given emotion
 * @param {string} emotion
 * @returns {string} Emoji character
 */
export const getEmotionEmoji = (emotion) => {
  const map = {
    happy: '😄',
    sad: '😢',
    angry: '😠',
    neutral: '😐',
    surprise: '😲',
    fear: '😨',
  };
  return map[emotion?.toLowerCase()] || '🤔';
};

/**
 * Returns the color for a given emotion
 * @param {string} emotion
 * @returns {string} Hex color
 */
export const getEmotionColor = (emotion) => {
  const map = {
    happy: '#10b981',
    sad: '#60a5fa',
    angry: '#ef4444',
    neutral: '#94a3b8',
    surprise: '#f59e0b',
    fear: '#a78bfa',
  };
  return map[emotion?.toLowerCase()] || '#94a3b8';
};

/**
 * Formats a timestamp into a readable time string
 * @param {string|Date} timestamp
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Truncates text to a specified length
 * @param {string} text
 * @param {number} maxLength
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Copies text to clipboard and returns a promise
 * @param {string} text
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

/**
 * Exports analysis data as a JSON file
 * @param {Object} data - Analysis data to export
 * @param {string} filename - Name of the file (without extension)
 */
export const exportAsJSON = (data, filename = 'sentiment-analysis') => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates a unique message ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

/**
 * Calculates aggregate statistics from multiple analysis results
 * @param {Array} analyses - Array of analysis objects
 * @returns {Object} Aggregated stats
 */
export const calculateSessionStats = (analyses) => {
  if (!analyses || analyses.length === 0) {
    return {
      sentimentDistribution: { Positive: 0, Negative: 0, Neutral: 0 },
      emotionAverages: { happy: 0, sad: 0, angry: 0, neutral: 0, surprise: 0, fear: 0 },
      totalAnalyses: 0,
      avgConfidence: 0,
    };
  }

  // Sentiment distribution count
  const sentimentDistribution = { Positive: 0, Negative: 0, Neutral: 0 };
  analyses.forEach((a) => {
    const s = a.sentiment || 'Neutral';
    sentimentDistribution[s] = (sentimentDistribution[s] || 0) + 1;
  });

  // Emotion averages
  const emotionKeys = ['happy', 'sad', 'angry', 'neutral', 'surprise', 'fear'];
  const emotionAverages = {};
  emotionKeys.forEach((key) => {
    const sum = analyses.reduce((acc, a) => acc + (a.emotions?.[key] || 0), 0);
    emotionAverages[key] = Math.round(sum / analyses.length);
  });

  // Average confidence
  const avgConfidence = Math.round(
    analyses.reduce((acc, a) => acc + (a.confidence || 0), 0) / analyses.length
  );

  return {
    sentimentDistribution,
    emotionAverages,
    totalAnalyses: analyses.length,
    avgConfidence,
  };
};

/**
 * Debounces a function call
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
