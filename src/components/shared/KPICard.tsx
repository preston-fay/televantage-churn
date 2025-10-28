import React from 'react';
import Provenance from '@/components/agent/Provenance';
import type { AgentRun } from '@/types/agent';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  formatter?: (value: number) => string;
  className?: string;
  agentRun?: AgentRun | null;
  showProvenance?: boolean;
}

export default function KPICard({
  label,
  value,
  trend,
  formatter,
  className = '',
  agentRun,
  showProvenance = false,
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
      {showProvenance && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
          <Provenance agentRun={agentRun} compact />
        </div>
      )}
    </div>
  );
}
