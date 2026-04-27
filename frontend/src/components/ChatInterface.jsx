/**
 * ChatInterface Component
 * The primary interface for the application.
 * Handles user input, displays messages, and coordinates with the backend.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeText, sendChatMessage } from '../services/apiService';
import { generateId, formatTime, truncateText } from '../utils/helpers';
import './ChatInterface.css';

// ─── Message Types ─────────────────────────────────────────────────────────
const MESSAGE_TYPES = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system',
};

// Welcome message shown at start
const WELCOME_MESSAGE = {
  id: 'welcome',
  type: MESSAGE_TYPES.AI,
  content: `👋 Welcome to **AI Sentiment Intelligence System**!

I'm your AI-powered sentiment analyst. You can:
• 📊 **Analyze** any text for sentiment, emotions & keywords
• 💬 **Chat** with me to understand your results
• 🌐 Write in **English, Hindi, or Hinglish** — I understand all!

Type or paste your text below and hit **Analyze** to get started!`,
  timestamp: new Date().toISOString(),
};

const ChatInterface = ({ onAnalysisComplete, onClearSession }) => {
  // ─── State ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [charCount, setCharCount] = useState(0);

  // ─── Refs ────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatInputRef = useRef(null);

  // ─── Auto-scroll to bottom ───────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ─── Add message to conversation ─────────────────────────────────────────
  const addMessage = useCallback((type, content, metadata = {}) => {
    const newMessage = {
      id: generateId(),
      type,
      content,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  // ─── Get conversation history for API context ────────────────────────────
  const getConversationHistory = useCallback((msgs) => {
    return msgs
      .filter((m) => m.type === MESSAGE_TYPES.USER || m.type === MESSAGE_TYPES.AI)
      .filter((m) => m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({
        role: m.type === MESSAGE_TYPES.USER ? 'user' : 'assistant',
        content: m.content,
      }));
  }, []);

  // ─── Handle Text Analysis ─────────────────────────────────────────────────
  const handleAnalyze = async () => {
    const text = inputText.trim();

    if (!text) {
      addMessage(MESSAGE_TYPES.SYSTEM, '⚠️ Please enter some text to analyze.');
      return;
    }

    if (text.length > 5000) {
      addMessage(MESSAGE_TYPES.SYSTEM, '⚠️ Text is too long. Please limit to 5000 characters.');
      return;
    }

    // Add user message
    const userMsg = addMessage(MESSAGE_TYPES.USER, text, { isAnalysis: true });
    setInputText('');
    setCharCount(0);
    setIsAnalyzing(true);
    setIsTyping(true);

    try {
      const history = getConversationHistory([...messages, userMsg]);
      const response = await analyzeText(text, history);

      if (!response.success) {
        throw new Error(response.error || 'Analysis failed');
      }

      const analysis = response.data;
      setLastAnalysis(analysis);

      // Add AI analysis response message
      const aiMessage = buildAnalysisMessage(analysis);
      setIsTyping(false);
      addMessage(MESSAGE_TYPES.AI, aiMessage, { analysisData: analysis });

      // Notify parent component to update dashboard
      onAnalysisComplete?.(analysis);

    } catch (error) {
      setIsTyping(false);
      addMessage(
        MESSAGE_TYPES.AI,
        `❌ **Analysis Error**: ${error.message}\n\nPlease check your API configuration or try again.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Handle Chat Message ──────────────────────────────────────────────────
  const handleChat = async () => {
    const message = chatInput.trim();
    if (!message || isChatting) return;

    addMessage(MESSAGE_TYPES.USER, message);
    setChatInput('');
    setIsChatting(true);
    setIsTyping(true);

    try {
      const history = getConversationHistory(messages);
      const response = await sendChatMessage(message, history, lastAnalysis);

      if (!response.success) {
        throw new Error(response.error || 'Chat failed');
      }

      setIsTyping(false);
      addMessage(MESSAGE_TYPES.AI, response.data.response);

    } catch (error) {
      setIsTyping(false);
      addMessage(MESSAGE_TYPES.AI, `❌ ${error.message}`);
    } finally {
      setIsChatting(false);
    }
  };

  // ─── Build formatted analysis message ───────────────────────────────────
  const buildAnalysisMessage = (analysis) => {
    const emoji = { Positive: '😊', Negative: '😔', Neutral: '😐' }[analysis.sentiment] || '🤔';
    const topEmotions = Object.entries(analysis.emotions || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(' • ');

    return `${emoji} **${analysis.sentiment} Sentiment** — ${analysis.confidence}% confidence

${analysis.explanation}

🎭 **Top Emotions**: ${topEmotions}
🔑 **Keywords**: ${(analysis.keywords || []).slice(0, 5).join(', ')}
${analysis.language ? `🌐 **Language**: ${analysis.language}` : ''}

💡 **Suggestion**: ${analysis.suggestion}`;
  };

  // ─── Handle keyboard shortcuts ────────────────────────────────────────────
  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  // ─── Clear session ───────────────────────────────────────────────────────
  const handleClearSession = () => {
    setMessages([WELCOME_MESSAGE]);
    setLastAnalysis(null);
    setInputText('');
    setChatInput('');
    setCharCount(0);
    onClearSession?.();
  };

  // ─── Handle "Analyze Again" ───────────────────────────────────────────────
  const handleAnalyzeAgain = (text) => {
    setInputText(text);
    textareaRef.current?.focus();
  };

  // ─── Render markdown-like formatting ─────────────────────────────────────
  const renderMessageContent = (content) => {
    if (!content) return null;
    // Simple markdown-like rendering
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Bold text
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className="chat-container" id="chat-interface">
      {/* ─── Messages Area ─────────────────────────────────────────────── */}
      <div className="chat-messages" id="chat-messages-list" role="log" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message chat-message--${msg.type} fade-in`}
          >
            {/* AI Avatar */}
            {msg.type === MESSAGE_TYPES.AI && (
              <div className="chat-avatar chat-avatar--ai" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-2 4-3.1 6-3.1s5.97 1.1 6 3.1a7.2 7.2 0 0 1-6 3.22z"/>
                </svg>
              </div>
            )}

            {/* System message */}
            {msg.type === MESSAGE_TYPES.SYSTEM && (
              <div className="chat-system-message">
                {renderMessageContent(msg.content)}
              </div>
            )}

            {/* Message bubble */}
            {msg.type !== MESSAGE_TYPES.SYSTEM && (
              <div className="chat-bubble-wrapper">
                <div className={`chat-bubble chat-bubble--${msg.type}`}>
                  <div className="chat-bubble-content">
                    {renderMessageContent(msg.content)}
                  </div>
                </div>

                <div className="chat-bubble-meta">
                  <span className="chat-time">{formatTime(msg.timestamp)}</span>
                  {msg.type === MESSAGE_TYPES.AI && msg.analysisData && (
                    <button
                      className="btn btn-sm btn-ghost chat-analyze-again"
                      onClick={() => handleAnalyzeAgain(msg.analysisData.analyzedText)}
                      id={`analyze-again-${msg.id}`}
                    >
                      🔄 Analyze Again
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* User Avatar */}
            {msg.type === MESSAGE_TYPES.USER && (
              <div className="chat-avatar chat-avatar--user" aria-hidden="true">
                👤
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="chat-message chat-message--ai fade-in">
            <div className="chat-avatar chat-avatar--ai">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-2 4-3.1 6-3.1s5.97 1.1 6 3.1a7.2 7.2 0 0 1-6 3.22z"/>
              </svg>
            </div>
            <div className="chat-bubble chat-bubble--ai">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Text Analysis Input ─────────────────────────────────────────── */}
      <div className="chat-analyze-section">
        <div className="chat-analyze-header">
          <span className="chat-analyze-label">
            📝 Enter text to analyze
          </span>
          <div className="chat-analyze-actions">
            <span className={`char-counter ${charCount > 4500 ? 'char-counter--warning' : ''}`}>
              {charCount}/5000
            </span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={handleClearSession}
              id="clear-session-btn"
              data-tooltip="Clear all messages"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          id="analysis-text-input"
          className="input-field chat-text-input"
          placeholder="Type your text here in English, Hindi, or Hinglish... (Ctrl+Enter to analyze)"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setCharCount(e.target.value.length);
          }}
          onKeyDown={handleTextareaKeyDown}
          rows={4}
          maxLength={5000}
          disabled={isAnalyzing}
        />

        <button
          id="analyze-btn"
          className="btn btn-primary analyze-btn"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !inputText.trim()}
        >
          {isAnalyzing ? (
            <>
              <div className="spinner"></div>
              Analyzing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Analyze Sentiment
            </>
          )}
        </button>
      </div>

      {/* ─── Chat Input ─────────────────────────────────────────────────── */}
      {lastAnalysis && (
        <div className="chat-input-section fade-in">
          <div className="chat-input-wrapper">
            <span className="chat-input-icon">💬</span>
            <input
              ref={chatInputRef}
              id="chat-message-input"
              type="text"
              className="input-field chat-message-input"
              placeholder="Ask me about the analysis results..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              disabled={isChatting}
            />
            <button
              id="send-chat-btn"
              className="btn btn-primary btn-sm chat-send-btn"
              onClick={handleChat}
              disabled={isChatting || !chatInput.trim()}
              aria-label="Send message"
            >
              {isChatting ? (
                <div className="spinner" style={{ width: 14, height: 14 }}></div>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
          <p className="chat-hint">Press Enter to send • Ask follow-up questions about your analysis</p>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
