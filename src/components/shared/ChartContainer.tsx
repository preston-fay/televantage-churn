import React from 'react';
import Provenance from '@/components/agent/Provenance';
import type { AgentRun } from '@/types/agent';

interface ChartContainerProps {
  title: string;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
  agentRun?: AgentRun | null;
  showProvenance?: boolean;
}

export default function ChartContainer({
  title,
  isLoading = false,
  children,
  className = '',
  agentRun,
  showProvenance = false,
}: ChartContainerProps) {
  return (
    <div className={`chart-container ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
        {showProvenance && <Provenance agentRun={agentRun} compact />}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
