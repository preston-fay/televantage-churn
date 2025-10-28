import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  size?: 'small' | 'medium' | 'large';
}

export default function MetricCard({
  label,
  value,
  subtitle,
  trend,
  size = 'medium',
}: MetricCardProps) {
  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-5xl',
  };

  const trendColors = {
    up: '#C8A5F0',      // Kearney primary purple
    down: '#D2D2D2',    // Kearney gray (neutral, not alarming red)
    neutral: '#A5A5A5', // Kearney gray
  };

  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="text-text-tertiary text-sm font-medium mb-2">{label}</div>
      <div className={`text-text-primary font-bold mb-1 ${sizeClasses[size]}`}>{value}</div>
      {subtitle && (
        <div
          className="text-sm font-medium"
          style={{ color: trend ? trendColors[trend] : 'var(--color-text-secondary)' }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
