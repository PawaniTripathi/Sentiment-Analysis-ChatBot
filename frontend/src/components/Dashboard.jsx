/**
 * Dashboard Component
 * Displays session-based analytics using Chart.js
 * All data is in-memory (no persistence)
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { calculateSessionStats, getEmotionColor } from '../utils/helpers';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Dashboard = ({ analyses, theme }) => {
  // Calculate session stats from all analyses
  const stats = useMemo(() => calculateSessionStats(analyses), [analyses]);

  const isEmpty = analyses.length === 0;

  // ─── Pie Chart Data (Sentiment Distribution) ──────────────────────────
  const pieData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [
          stats.sentimentDistribution.Positive,
          stats.sentimentDistribution.Negative,
          stats.sentimentDistribution.Neutral,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#a0a0c0' : '#4a4a6a',
          padding: 16,
          font: { family: 'Inter', size: 12, weight: '600' },
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#13131f' : '#ffffff',
        titleColor: theme === 'dark' ? '#f0f0ff' : '#0a0a1a',
        bodyColor: theme === 'dark' ? '#a0a0c0' : '#4a4a6a',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
          },
        },
      },
    },
  };

  // ─── Bar Chart Data (Emotion Frequency) ──────────────────────────────
  const emotionLabels = ['Happy', 'Sad', 'Angry', 'Neutral', 'Surprise', 'Fear'];
  const emotionKeys = ['happy', 'sad', 'angry', 'neutral', 'surprise', 'fear'];

  const barData = {
    labels: emotionLabels,
    datasets: [
      {
        label: 'Avg. Emotion Score (%)',
        data: emotionKeys.map((k) => stats.emotionAverages[k] || 0),
        backgroundColor: emotionKeys.map((k) => `${getEmotionColor(k)}99`),
        borderColor: emotionKeys.map((k) => getEmotionColor(k)),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#13131f' : '#ffffff',
        titleColor: theme === 'dark' ? '#f0f0ff' : '#0a0a1a',
        bodyColor: theme === 'dark' ? '#a0a0c0' : '#4a4a6a',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.formattedValue}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: theme === 'dark' ? '#a0a0c0' : '#4a4a6a',
          font: { family: 'Inter', size: 11, weight: '600' },
        },
        border: { color: 'transparent' },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: theme === 'dark' ? '#a0a0c0' : '#4a4a6a',
          font: { family: 'Inter', size: 11 },
          callback: (val) => `${val}%`,
        },
        border: { color: 'transparent' },
      },
    },
  };

  return (
    <div className="dashboard" id="dashboard-section">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          📊 Session Dashboard
        </h2>
        <span className="dashboard-count">
          {analyses.length} {analyses.length === 1 ? 'Analysis' : 'Analyses'}
        </span>
      </div>

      {/* ─── Stats Row ─────────────────────────────────────────────────── */}
      <div className="dashboard-stats">
        <div className="stat-item" id="stat-total">
          <div className="stat-value">{stats.totalAnalyses}</div>
          <div className="stat-label">Total Analyses</div>
        </div>
        <div className="stat-item" id="stat-confidence">
          <div className="stat-value">{isEmpty ? '—' : `${stats.avgConfidence}%`}</div>
          <div className="stat-label">Avg Confidence</div>
        </div>
        <div className="stat-item" id="stat-positive">
          <div className="stat-value positive">{stats.sentimentDistribution.Positive}</div>
          <div className="stat-label">Positive</div>
        </div>
        <div className="stat-item" id="stat-negative">
          <div className="stat-value negative">{stats.sentimentDistribution.Negative}</div>
          <div className="stat-label">Negative</div>
        </div>
      </div>

      {isEmpty ? (
        <div className="dashboard-empty">
          <div className="empty-icon">📈</div>
          <p className="empty-title">No data yet</p>
          <p className="empty-sub">Analyze some text to see your session insights here</p>
        </div>
      ) : (
        <div className="dashboard-charts">
          {/* ─── Sentiment Pie Chart ─────────────────────────────────── */}
          <div className="chart-card" id="sentiment-pie-chart">
            <div className="chart-title">Sentiment Distribution</div>
            <div className="chart-wrapper">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          {/* ─── Emotion Bar Chart ───────────────────────────────────── */}
          <div className="chart-card" id="emotion-bar-chart">
            <div className="chart-title">Emotion Averages</div>
            <div className="chart-wrapper">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
