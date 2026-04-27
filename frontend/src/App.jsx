/**
 * App.jsx — Root Application Component
 * Manages global state: theme, session analyses, and last analysis result
 */

import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import ResultCards from './components/ResultCards';
import Dashboard from './components/Dashboard';
import './styles/App.css';

const App = () => {
  // ─── Theme State ─────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sis-theme') || 'dark';
  });

  // ─── Session State (in-memory only) ──────────────────────────────────────
  const [sessionAnalyses, setSessionAnalyses] = useState([]); // All analyses this session
  const [currentAnalysis, setCurrentAnalysis] = useState(null); // Most recent analysis
  const [activeTab, setActiveTab] = useState('results'); // 'results' or 'dashboard'

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sis-theme', theme);
  }, [theme]);

  // ─── Toggle theme ─────────────────────────────────────────────────────────
  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // ─── Handle new analysis result from ChatInterface ────────────────────────
  const handleAnalysisComplete = useCallback((analysis) => {
    setCurrentAnalysis(analysis);
    setSessionAnalyses((prev) => [...prev, analysis]);
    // Switch to results tab when new analysis comes in
    setActiveTab('results');
  }, []);

  // ─── Clear session ────────────────────────────────────────────────────────
  const handleClearSession = useCallback(() => {
    setSessionAnalyses([]);
    setCurrentAnalysis(null);
  }, []);

  return (
    <div className="app-container" data-theme={theme}>
      {/* ─── Top Navigation ──────────────────────────────────────────────── */}
      <Header theme={theme} onToggleTheme={handleToggleTheme} />

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="app-main" role="main">
        <div className="app-layout">

          {/* ─── Left Column: Chatbot (primary) ──────────────────────────── */}
          <section className="app-left" aria-label="Chat Interface">
            <ChatInterface
              onAnalysisComplete={handleAnalysisComplete}
              onClearSession={handleClearSession}
            />
          </section>

          {/* ─── Right Column: Results + Dashboard ───────────────────────── */}
          <aside className="app-right" aria-label="Analysis Results">
            {/* Tab Switcher */}
            <div className="tab-bar" role="tablist">
              <button
                id="tab-results"
                role="tab"
                aria-selected={activeTab === 'results'}
                className={`tab-btn ${activeTab === 'results' ? 'tab-btn--active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                📊 Results
              </button>
              <button
                id="tab-dashboard"
                role="tab"
                aria-selected={activeTab === 'dashboard'}
                className={`tab-btn ${activeTab === 'dashboard' ? 'tab-btn--active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📈 Dashboard
                {sessionAnalyses.length > 0 && (
                  <span className="tab-badge">{sessionAnalyses.length}</span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'results' && (
                <div className="tab-panel fade-in">
                  {currentAnalysis ? (
                    <ResultCards analysis={currentAnalysis} />
                  ) : (
                    <div className="empty-results">
                      <div className="empty-results-icon">🔍</div>
                      <h3 className="empty-results-title">No Analysis Yet</h3>
                      <p className="empty-results-sub">
                        Enter text in the chat and click <strong>Analyze Sentiment</strong> to see results here.
                      </p>
                      <div className="quick-examples">
                        <p className="quick-examples-label">Try these examples:</p>
                        <div className="quick-example-chips">
                          <span className="example-chip example-chip--positive">
                            "I'm so happy today!"
                          </span>
                          <span className="example-chip example-chip--negative">
                            "This is really frustrating"
                          </span>
                          <span className="example-chip example-chip--neutral">
                            "Aaj mausam acha hai"
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="tab-panel fade-in">
                  <Dashboard analyses={sessionAnalyses} theme={theme} />
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <p>
          AI Sentiment Intelligence System • Powered by{' '}
          <span className="text-gradient">OpenRouter AI</span>
          {' '}• Supports 🇬🇧 English · 🇮🇳 Hindi · Hinglish
        </p>
      </footer>
    </div>
  );
};

export default App;
