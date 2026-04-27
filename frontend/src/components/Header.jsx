/**
 * Header Component
 * Top navigation bar with logo, title, and theme toggle
 */

import React from 'react';
import './Header.css';

const Header = ({ theme, onToggleTheme }) => {
  return (
    <header className="header" id="app-header">
      <div className="header-left">
        {/* Logo Icon */}
        <div className="header-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12" fill="url(#logo-gradient)" opacity="0.2"/>
            <circle cx="14" cy="14" r="8" fill="url(#logo-gradient)" opacity="0.4"/>
            <circle cx="14" cy="14" r="4" fill="url(#logo-gradient)"/>
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="28" y2="28">
                <stop offset="0%" stopColor="#8b5cf6"/>
                <stop offset="100%" stopColor="#a78bfa"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <div className="header-title-group">
          <h1 className="header-title">
            <span className="text-gradient">AI Sentiment</span>
            <span className="header-title-sub"> Intelligence</span>
          </h1>
          <span className="header-badge">
            <span className="header-badge-dot"></span>
            Live Analysis
          </span>
        </div>
      </div>

      <div className="header-right">
        {/* Multilingual indicator */}
        <div className="lang-indicator" data-tooltip="Supports English, Hindi & Hinglish">
          <span>🌐</span>
          <span className="lang-label">Multi-lingual</span>
        </div>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          data-tooltip={`${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
