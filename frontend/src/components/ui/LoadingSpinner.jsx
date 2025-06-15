import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', overlay = false }) => {
  const spinnerClass = `loading-spinner ${size}`;
  
  const content = (
    <div className="loading-spinner-container">
      <div className={spinnerClass}></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = '#d4af37' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(212, 175, 55, 0.2)"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 0.5s ease-in-out',
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%'
        }}
      />
    </svg>
  );
};

export default LoadingSpinner;