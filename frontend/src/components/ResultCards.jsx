/**
 * ResultCards Component
 * Displays structured analysis results in beautiful card format
 */

import React from 'react';
import {
  getSentimentClass,
  getSentimentEmoji,
  getEmotionEmoji,
  getEmotionColor,
  copyToClipboard,
  truncateText,
} from '../utils/helpers';
import './ResultCards.css';

const ResultCards = ({ analysis }) => {

  if (!analysis) return null;

  const sentimentClass = getSentimentClass(analysis.sentiment);
  const sentimentEmoji = getSentimentEmoji(analysis.sentiment);

  // Sort emotions by score descending
  const sortedEmotions = Object.entries(analysis.emotions || {})
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="results-container" id="results-section">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="results-header">
        <h2 className="results-title">Analysis Results</h2>
      </div>

      {/* ─── Analyzed Text Preview ──────────────────────────────────────── */}
      <div className="result-card analyzed-text-card fade-in">
        <div className="card-label">📝 Analyzed Text</div>
        <p className="analyzed-text-content">
          "{truncateText(analysis.analyzedText, 200)}"
        </p>
        {analysis.language && (
          <span className="language-tag">🌐 {analysis.language}</span>
        )}
      </div>

      {/* ─── Sentiment Card ──────────────────────────────────────────────── */}
      <div className={`result-card sentiment-card sentiment-card--${sentimentClass} fade-in`}
           id="sentiment-result-card">
        <div className="sentiment-icon">{sentimentEmoji}</div>
        <div className="sentiment-info">
          <div className="card-label">Overall Sentiment</div>
          <div className={`sentiment-value sentiment-value--${sentimentClass}`}>
            {analysis.sentiment}
          </div>
        </div>
        <div className="confidence-section">
          <div className="confidence-label">
            Confidence
            <span className="confidence-value">{analysis.confidence}%</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill progress-fill--${sentimentClass}`}
              style={{ width: `${analysis.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Emotions Card ──────────────────────────────────────────────── */}
      <div className="result-card fade-in" id="emotions-result-card">
        <div className="card-label">🎭 Emotion Breakdown</div>
        <div className="emotions-list">
          {sortedEmotions.map(([emotion, score]) => (
            <div key={emotion} className="emotion-item">
              <div className="emotion-header">
                <span className="emotion-name">
                  {getEmotionEmoji(emotion)} {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                </span>
                <span className="emotion-score" style={{ color: getEmotionColor(emotion) }}>
                  {score}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${score}%`,
                    background: getEmotionColor(emotion),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Keywords Card ──────────────────────────────────────────────── */}
      <div className="result-card fade-in" id="keywords-result-card">
        <div className="card-label">🔑 Key Topics</div>
        <div className="keywords-grid">
          {(analysis.keywords || []).map((keyword, index) => (
            <span
              key={index}
              className="keyword-tag"
              style={{
                animationDelay: `${index * 0.05}s`,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Suggestion Card ────────────────────────────────────────────── */}
      <div className={`result-card suggestion-card suggestion-card--${sentimentClass} fade-in`}
           id="suggestion-result-card">
        <div className="suggestion-header">
          <span className="card-label">
            {analysis.sentiment === 'Positive' ? '✨ Refinement Tip' : '💡 Improved Version'}
          </span>
        </div>
        <p className="suggestion-text">{analysis.suggestion}</p>
        <button
          id="copy-suggestion-btn"
          className="btn btn-ghost btn-sm suggestion-copy-btn"
          onClick={() => copyToClipboard(analysis.suggestion)}
        >
          📋 Copy Suggestion
        </button>
      </div>
    </div>
  );
};

export default ResultCards;
