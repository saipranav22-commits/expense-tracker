import React from 'react';
import './SummaryCard.css';

function SummaryCard({ title, value, icon, color, subtitle, index = 0 }) {
  const delay = index * 0.08;

  return (
    <div
      className="summary-card glass"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Glow effect */}
      <div
        className="summary-card-glow"
        style={{ background: color || 'var(--accent-primary)' }}
      />

      {/* Top row */}
      <div className="summary-card-top">
        <div className="summary-card-label">{title}</div>
        <div
          className="summary-card-icon"
          style={{ background: `${color || 'var(--accent-primary)'}22`, color: color || 'var(--accent-primary)' }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div
        className="summary-card-value"
        style={{ color: color || 'var(--text-primary)' }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="summary-card-subtitle">{subtitle}</div>
      )}

      {/* Decorative bar */}
      <div
        className="summary-card-bar"
        style={{ background: `linear-gradient(90deg, ${color || 'var(--accent-primary)'}, transparent)` }}
      />
    </div>
  );
}

export default SummaryCard;
