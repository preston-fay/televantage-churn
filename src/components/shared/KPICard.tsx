import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  formatter?: (value: number) => string;
  className?: string;
}

export default function KPICard({
  label,
  value,
  trend,
  formatter,
  className = '',
}: KPICardProps) {
  const displayValue = typeof value === 'number' && formatter ? formatter(value) : value;

  return (
    <div className={`card ${className}`}>
      <div className="text-text-tertiary text-sm font-medium mb-2">{label}</div>
      <div className="text-text-primary text-3xl font-bold mb-2">{displayValue}</div>
      {trend && (
        <div className="text-sm font-medium text-text-primary">
          {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
